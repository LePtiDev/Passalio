const TOLERANCE_SECONDS = 300;

const hexOf = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const isSameText = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let position = 0; position < left.length; position += 1) {
    difference |= left.charCodeAt(position) ^ right.charCodeAt(position);
  }
  return difference === 0;
};

const partsOf = (header: string) => {
  const entries = header.split(",").map((part) => part.trim().split("="));
  return {
    timestamp: Number(entries.find(([key]) => key === "t")?.[1]),
    signatures: entries.filter(([key]) => key === "v1").map(([, value]) => value ?? ""),
  };
};

export const signStripePayload = async (
  payload: string,
  secret: string,
  timestamp: number,
): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  return hexOf(signature);
};

export const isValidStripeSignature = async ({
  payload,
  header,
  secret,
  now,
}: {
  readonly payload: string;
  readonly header: string | undefined;
  readonly secret: string;
  readonly now: Date;
}): Promise<boolean> => {
  if (header === undefined) {
    return false;
  }
  const { timestamp, signatures } = partsOf(header);
  if (!Number.isFinite(timestamp) || signatures.length === 0) {
    return false;
  }
  if (Math.abs(now.getTime() / 1000 - timestamp) > TOLERANCE_SECONDS) {
    return false;
  }
  const expected = await signStripePayload(payload, secret, timestamp);
  return signatures.some((signature) => isSameText(signature, expected));
};
