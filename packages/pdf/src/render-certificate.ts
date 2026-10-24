import fontkit from "@pdf-lib/fontkit";
import { err, ok, type Result } from "@passalio/shared";
import { PDFDocument, type PDFImage } from "pdf-lib";
import {
  certificateContent,
  type CertificateContent,
  type CertificatePdfError,
} from "./certificate-content";
import { SOFT_BRAND_COLORS, type CertificatePdfInput } from "./certificate-pdf-input";
import { initialsOf, longDate } from "./format";
import { pdfFr } from "./fr";
import { adviceBlocks, companyMessageBlock } from "./layout/advice-blocks";
import type { Block } from "./layout/block";
import { drawFooter, footerHeight } from "./layout/footer";
import { drawLetterhead, drawSlimHeader } from "./layout/headers";
import {
  checksBlock,
  fluesBlock,
  observationsBlock,
  paragraphBlock,
} from "./layout/inspection-blocks";
import {
  datesBlock,
  doNotUseBlock,
  equipmentBlock,
  legalBasisBlock,
  partiesBlock,
} from "./layout/overview-blocks";
import { paginate } from "./layout/paginate";
import { PAGE_HEIGHT, type Theme } from "./layout/page-geometry";
import { signaturesBlock } from "./layout/signature-block";
import type { EmbeddedFonts, FontWeight } from "./layout/text";

export type CertificateFonts = Readonly<Record<FontWeight, Uint8Array>>;

const PINNED_GAP = 12;

const FONT_NAMES: Readonly<Record<FontWeight, string>> = {
  regular: "PlusJakartaSans-Regular",
  semibold: "PlusJakartaSans-SemiBold",
  bold: "PlusJakartaSans-Bold",
  extrabold: "PlusJakartaSans-ExtraBold",
};

const embedFonts = async (
  document: PDFDocument,
  fonts: CertificateFonts,
): Promise<EmbeddedFonts> => {
  document.registerFontkit(fontkit);
  const embed = (weight: FontWeight) =>
    document.embedFont(fonts[weight], { subset: true, customName: FONT_NAMES[weight] });
  const [regular, semibold, bold, extrabold] = await Promise.all([
    embed("regular"),
    embed("semibold"),
    embed("bold"),
    embed("extrabold"),
  ]);
  return { regular, semibold, bold, extrabold };
};

type Images = {
  readonly logo: PDFImage | null;
  readonly technician: PDFImage;
  readonly customer: PDFImage | null;
};

const embedLogo = (document: PDFDocument, logo: CertificatePdfInput["branding"]["logo"]) => {
  if (logo === null) {
    return null;
  }
  return logo.format === "png" ? document.embedPng(logo.base64) : document.embedJpg(logo.base64);
};

const embedImages = async (
  document: PDFDocument,
  input: CertificatePdfInput,
  content: CertificateContent,
): Promise<Result<Images, CertificatePdfError>> => {
  try {
    const signature = content.customerSignature;
    return ok({
      logo: await embedLogo(document, input.branding.logo),
      technician: await document.embedPng(content.technician.signature),
      customer: signature.isAbsent ? null : await document.embedPng(signature.signature),
    });
  } catch {
    return err("unreadable_image");
  }
};

const contactLineOf = ({ phone, email, website }: CertificatePdfInput["branding"]["contact"]) => {
  const parts = [phone, email, website].filter((part): part is string => part !== null);
  return parts.length === 0 ? null : parts.join(" · ");
};

const certificateBlocks = (
  input: CertificatePdfInput,
  content: CertificateContent,
  images: Images,
  theme: Theme,
): readonly Block[] => {
  const message = input.branding.customerMessage;
  return [
    ...(content.doNotUse === null ? [] : [doNotUseBlock(content.doNotUse)]),
    legalBasisBlock(),
    datesBlock(content.dates, theme),
    partiesBlock(content, theme),
    equipmentBlock(content.equipment, theme),
    fluesBlock(content.flues, theme),
    checksBlock(content.checks, theme),
    ...observationsBlock(content, theme),
    ...(content.advice === null && message !== null
      ? [paragraphBlock(pdfFr.certificate.companyMessage, message, theme)]
      : []),
    signaturesBlock(
      {
        label: pdfFr.signatures.technician,
        name: content.technician.label,
        image: images.technician,
        note: content.technician.note,
      },
      {
        label: pdfFr.signatures.customer,
        name: input.certificate.customer.name,
        image: images.customer,
        note: content.customerSignature.note,
      },
    ),
  ];
};

const draw = async (
  input: CertificatePdfInput,
  content: CertificateContent,
  fonts: CertificateFonts,
): Promise<Result<Uint8Array, CertificatePdfError>> => {
  const document = await PDFDocument.create({ updateMetadata: false });
  const embeddedFonts = await embedFonts(document, fonts);
  const embedded = await embedImages(document, input, content);
  if (!embedded.isOk) {
    return embedded;
  }
  const images = embedded.value;
  const { branding, certificate } = input;
  const theme: Theme = {
    accent: branding.brandColor,
    accentSoft: SOFT_BRAND_COLORS[branding.brandColor],
    isBanner: branding.template === "banner",
  };
  const footer = { legalLine: content.legalLine, freeText: branding.footerText };
  const layout = {
    document,
    fonts: embeddedFonts,
    contentBottom: PAGE_HEIGHT - footerHeight(embeddedFonts, footer) - PINNED_GAP,
  };
  const slimHeader = {
    companyName: certificate.company.name,
    label: pdfFr.advicePage.header(content.number, longDate(content.signedOn)),
  };
  const letterhead = {
    companyName: certificate.company.name,
    address: certificate.company.address,
    contactLine: contactLineOf(branding.contact),
    logo: images.logo,
    initials: initialsOf(certificate.company.name),
    number: content.number,
  };
  paginate(layout, {
    blocks: certificateBlocks(input, content, images, theme),
    drawFirstHeader: (canvas) => drawLetterhead(canvas, letterhead, theme),
    drawNextHeader: (canvas) => drawSlimHeader(canvas, slimHeader, theme),
  });
  if (content.advice !== null) {
    const message = branding.customerMessage;
    paginate(layout, {
      blocks: [
        ...adviceBlocks(content.advice, theme),
        ...(message === null ? [] : [companyMessageBlock(message, theme)]),
      ],
      drawFirstHeader: (canvas) => drawSlimHeader(canvas, slimHeader, theme),
      drawNextHeader: (canvas) => drawSlimHeader(canvas, slimHeader, theme),
    });
  }
  const pages = document.getPages();
  pages.forEach((page, index) => {
    drawFooter({ page, fonts: embeddedFonts }, footer, { index: index + 1, count: pages.length });
  });
  const signedAt = new Date(input.document.signedAt);
  document.setTitle(`${pdfFr.certificate.title} ${pdfFr.certificate.number(content.number)}`);
  document.setAuthor(certificate.company.name);
  document.setCreator("Passalio");
  document.setProducer("Passalio");
  document.setLanguage("fr-FR");
  document.setCreationDate(signedAt);
  document.setModificationDate(signedAt);
  return ok(await document.save());
};

export const renderCertificate = async (
  data: unknown,
  fonts: CertificateFonts,
): Promise<Result<Uint8Array, CertificatePdfError>> => {
  const prepared = certificateContent(data);
  if (!prepared.isOk) {
    return prepared;
  }
  return draw(prepared.value.input, prepared.value.content, fonts);
};
