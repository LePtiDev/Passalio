import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { BRAND_COLORS } from "@passalio/shared";
import { describe, expect, it } from "vitest";
import { CUSTOMER_SIGNATURE, sampleInput } from "./certificate-pdf-fixture";
import { DOCUMENT_TEMPLATES } from "./certificate-pdf-input";
import { certificateFonts, pdfPagePngs } from "./pdf-test-support";
import { renderCertificate } from "./render-certificate";

const REFERENCE_DIRECTORY = new URL("../reference-pages/", import.meta.url);
const IS_UPDATING = process.env["PDF_REFERENCES"] === "update";
const MAX_DIFFERENT_PIXELS_RATIO = 0.002;
const FONTS = certificateFonts();

const pngsOf = async (input: unknown) => {
  const result = await renderCertificate(input, FONTS);
  if (!result.isOk) {
    throw new Error(result.error);
  }
  return pdfPagePngs(result.value, 1);
};

const differentPixelsRatio = (actual: Buffer, referenceName: string) => {
  const referenceUrl = new URL(referenceName, REFERENCE_DIRECTORY);
  if (IS_UPDATING) {
    mkdirSync(REFERENCE_DIRECTORY, { recursive: true });
    writeFileSync(referenceUrl, actual);
  }
  if (!existsSync(referenceUrl)) {
    return 1;
  }
  const expected = PNG.sync.read(readFileSync(referenceUrl));
  const received = PNG.sync.read(actual);
  if (expected.width !== received.width || expected.height !== received.height) {
    return 1;
  }
  const different = pixelmatch(
    expected.data,
    received.data,
    undefined,
    expected.width,
    expected.height,
    { threshold: 0.1 },
  );
  return different / (expected.width * expected.height);
};

const referenceCountOf = (name: string) =>
  readdirSync(REFERENCE_DIRECTORY).filter((file) => new RegExp(`^${name}-\\d+\\.png$`).test(file))
    .length;

const COLOR_NAMES: Readonly<Record<(typeof BRAND_COLORS)[number], string>> = {
  "#0F2A44": "navy",
  "#0E7C5A": "green",
  "#B42318": "red",
  "#1D4F91": "blue",
  "#334155": "slate",
};

const COLOR_CASES = DOCUMENT_TEMPLATES.flatMap((template) =>
  BRAND_COLORS.map(
    (brandColor) => [`${template}-${COLOR_NAMES[brandColor]}`, template, brandColor] as const,
  ),
);

describe("certificate pages match the validated mockup", () => {
  it.each(COLOR_CASES)("first page, %s", async (name, template, brandColor) => {
    const [firstPage] = await pngsOf(sampleInput({ branding: { template, brandColor } }));
    expect(differentPixelsRatio(firstPage ?? Buffer.alloc(0), `${name}-1.png`)).toBeLessThan(
      MAX_DIFFERENT_PIXELS_RATIO,
    );
  });

  const SCENARIOS: readonly (readonly [string, Parameters<typeof sampleInput>[0]])[] = [
    ["advice", {}],
    [
      "partial-customer-absent",
      {
        certificate: {
          sweepingExtent: "partial",
          unsweptPart: "les 2 derniers mètres, sous la souche.",
          isDoNotUse: true,
          chimneyStacks: "needs_repair",
          customerSignature: null,
          isCustomerAbsent: true,
        },
      },
    ],
    [
      "three-flues-logo",
      {
        certificate: {
          flues: [
            { designation: "Conduit du séjour" },
            { designation: "Conduit de la cuisine" },
            { designation: "Conduit de la chambre, à l'étage" },
          ],
        },
        branding: {
          logo: { format: "png", base64: CUSTOMER_SIGNATURE.replace("data:image/png;base64,", "") },
        },
      },
    ],
    [
      "long-texts",
      {
        certificate: {
          anomalies: Array.from(
            { length: 40 },
            (_, index) => `Constat numéro ${index + 1} sur le conduit.`,
          ).join(" "),
          flues: Array.from({ length: 10 }, (_, index) => ({
            designation: `Conduit ${index + 1}`,
          })),
        },
      },
    ],
  ];

  it.each(SCENARIOS)("every page, %s", async (name, overrides) => {
    const pages = await pngsOf(sampleInput(overrides));
    const ratios = pages.map((page, index) =>
      differentPixelsRatio(page, `${name}-${index + 1}.png`),
    );
    expect(pages).toHaveLength(referenceCountOf(name));
    expect(Math.max(...ratios)).toBeLessThan(MAX_DIFFERENT_PIXELS_RATIO);
  });
});
