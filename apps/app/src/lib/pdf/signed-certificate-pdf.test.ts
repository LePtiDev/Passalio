import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { certificateBody, SAMPLE_COMPANY, sampleIssuer } from "@/test-support/certificate-records";
import { renderSignedCertificate } from "./signed-certificate-pdf";

const fontOf = (name: string) =>
  new Uint8Array(
    readFileSync(
      new URL(`../../../../../packages/pdf/fonts/PlusJakartaSans-${name}.ttf`, import.meta.url),
    ),
  );

vi.mock("./certificate-fonts", () => ({
  certificateFonts: async () => ({
    regular: fontOf("Regular"),
    semibold: fontOf("SemiBold"),
    bold: fontOf("Bold"),
    extrabold: fontOf("ExtraBold"),
  }),
}));

const issuer = sampleIssuer();

const signedDocument = {
  numberPrefix: "RD-",
  number: 41,
  signedAt: "2026-10-23T09:30:00.000Z",
  data: {
    ...certificateBody(),
    company: SAMPLE_COMPANY,
    branding: issuer.branding,
  },
};

const textOf = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

describe("renderSignedCertificate", () => {
  it("renders the signed certificate as a PDF on the device, the same bytes each time", async () => {
    const first = await renderSignedCertificate(signedDocument);
    const second = await renderSignedCertificate(signedDocument);
    const [firstBytes, secondBytes] = [first, second].map((rendered) =>
      rendered.isOk ? rendered.value : new Uint8Array(),
    );
    expect(first.isOk).toBe(true);
    expect(textOf(firstBytes ?? new Uint8Array()).startsWith("%PDF-")).toBe(true);
    expect(firstBytes).toEqual(secondBytes);
  }, 30_000);
});
