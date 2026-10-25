import { describe, expect, it } from "vitest";
import { isValidStripeSignature, signStripePayload } from "./stripe-signature";

const SECRET = "whsec_test_secret";
const PAYLOAD = '{"id":"evt_1","type":"invoice.paid"}';
const NOW = new Date("2026-11-20T12:00:00.000Z");
const TIMESTAMP = NOW.getTime() / 1000;

const check = (header: string | undefined, now = NOW, payload = PAYLOAD) =>
  isValidStripeSignature({ payload, header, secret: SECRET, now });

describe("Stripe webhook signature", () => {
  it("signs like the HMAC-SHA256 that Stripe documents, over the timestamp and the payload", async () => {
    expect(TIMESTAMP).toBe(1_795_176_000);
    expect(await signStripePayload(PAYLOAD, SECRET, TIMESTAMP)).toBe(
      "124e132fa4ea296325416db16cad1067d6f7a9d2924de29b0e3dd478ac8286d8",
    );
  });

  it("accepts a payload signed with the webhook secret", async () => {
    const signature = await signStripePayload(PAYLOAD, SECRET, TIMESTAMP);
    expect(await check(`t=${TIMESTAMP},v1=${signature}`)).toBe(true);
  });

  it("accepts the header when one of several v1 signatures matches, as during a secret rotation", async () => {
    const signature = await signStripePayload(PAYLOAD, SECRET, TIMESTAMP);
    expect(await check(`t=${TIMESTAMP},v1=${"0".repeat(64)},v1=${signature},v0=ancienne`)).toBe(
      true,
    );
  });

  it("refuses a payload changed after signing", async () => {
    const signature = await signStripePayload(PAYLOAD, SECRET, TIMESTAMP);
    expect(
      await check(`t=${TIMESTAMP},v1=${signature}`, NOW, PAYLOAD.replace("paid", "void")),
    ).toBe(false);
  });

  it("refuses a payload signed with another secret", async () => {
    const signature = await signStripePayload(PAYLOAD, "whsec_autre", TIMESTAMP);
    expect(await check(`t=${TIMESTAMP},v1=${signature}`)).toBe(false);
  });

  it.each([
    ["accepts", 300, true],
    ["refuses", 301, false],
  ])("%s a signature %i seconds old", async (_verb, age, expected) => {
    const signature = await signStripePayload(PAYLOAD, SECRET, TIMESTAMP - age);
    expect(await check(`t=${TIMESTAMP - age},v1=${signature}`)).toBe(expected);
  });

  it.each([
    ["no header", undefined],
    ["an empty header", ""],
    ["no timestamp", "v1=abc"],
    ["no v1 signature", `t=${TIMESTAMP}`],
    ["a timestamp that is not a number", "t=hier,v1=abc"],
  ])("refuses %s", async (_case, header) => {
    expect(await check(header)).toBe(false);
  });
});
