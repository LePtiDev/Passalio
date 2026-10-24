const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

const decodeBase32 = (encoded: string): Uint8Array<ArrayBuffer> => {
  const bits = Array.from(encoded.replace(/=+$/, "").toUpperCase().split(""))
    .map((character) => BASE32_ALPHABET.indexOf(character).toString(2).padStart(5, "0"))
    .join("");
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  bytes.forEach((_, index) => {
    bytes[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  });
  return bytes;
};

const counterBytes = (counter: number): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(counter));
  return bytes;
};

export const secretOfTotpUri = (totpUri: string): string =>
  new URL(totpUri).searchParams.get("secret") ?? "";

export const totpCode = async (base32Secret: string, now = Date.now()): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    decodeBase32(base32Secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const counter = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, counterBytes(counter)));
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  const binary = new DataView(digest.buffer).getUint32(offset) & 0x7fffffff;
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0");
};
