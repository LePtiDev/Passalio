import { describe, expect, it } from "vitest";
import { pdfFingerprint } from "./pdf-fingerprint";

describe("pdfFingerprint", () => {
  it("returns the SHA-256 of the bytes in hexadecimal", async () => {
    expect(await pdfFingerprint(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
