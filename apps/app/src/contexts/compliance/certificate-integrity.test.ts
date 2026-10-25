import { describe, expect, it } from "vitest";
import { integrityOf, shortFingerprint } from "./certificate-integrity";

const ARCHIVED = "a3f921c7".padEnd(64, "0");

describe("integrityOf", () => {
  it("waits for the server while the PDF is not archived yet", () => {
    expect(integrityOf(null, undefined)).toStrictEqual({ status: "archiving" });
    expect(integrityOf(undefined, "anything")).toStrictEqual({ status: "archiving" });
  });

  it("is checking until the PDF shown on this device has its fingerprint", () => {
    expect(integrityOf(ARCHIVED, undefined)).toStrictEqual({ status: "checking" });
  });

  it("is verified when the PDF shown is the archived one, byte for byte", () => {
    expect(integrityOf(ARCHIVED, ARCHIVED)).toStrictEqual({
      status: "verified",
      fingerprint: ARCHIVED,
    });
  });

  it("warns when the PDF shown differs from the archived one", () => {
    expect(integrityOf(ARCHIVED, "b".repeat(64))).toStrictEqual({
      status: "mismatch",
      fingerprint: ARCHIVED,
    });
  });
});

describe("shortFingerprint", () => {
  it("shows the first eight characters in two groups", () => {
    expect(shortFingerprint(ARCHIVED)).toBe("a3f9 21c7");
  });
});
