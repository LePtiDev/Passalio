import { pdfFr } from "../fr";
import { CONTENT_WIDTH, MARGIN, PAGE_HEIGHT, PAGE_WIDTH, PALETTE } from "./page-geometry";
import { drawLine } from "./shapes";
import {
  drawText,
  textHeight,
  textWidth,
  type Canvas,
  type EmbeddedFonts,
  type TextStyle,
} from "./text";

export type FooterText = { readonly legalLine: string; readonly freeText: string | null };

const STYLE: TextStyle = { size: 7.125, weight: "regular", color: PALETTE.muted, lineHeight: 1.45 };
const PAGE_LABEL_WIDTH = 60;
const BOTTOM_PADDING = 13.5;
const TOP_PADDING = 7.5;

const freeTextWidth = CONTENT_WIDTH - PAGE_LABEL_WIDTH;

export const footerHeight = (fonts: EmbeddedFonts, footer: FooterText) =>
  TOP_PADDING +
  textHeight(fonts, footer.legalLine, STYLE, CONTENT_WIDTH) +
  Math.max(textHeight(fonts, footer.freeText ?? " ", STYLE, freeTextWidth), STYLE.size * 1.45) +
  BOTTOM_PADDING;

export const drawFooter = (
  canvas: Canvas,
  footer: FooterText,
  page: { readonly index: number; readonly count: number },
) => {
  const top = PAGE_HEIGHT - footerHeight(canvas.fonts, footer);
  drawLine(canvas, { x: MARGIN, top, width: CONTENT_WIDTH, color: PALETTE.border });
  let y = top + TOP_PADDING;
  y += drawText(canvas, footer.legalLine, STYLE, { x: MARGIN, top: y, width: CONTENT_WIDTH });
  if (footer.freeText !== null) {
    drawText(canvas, footer.freeText, STYLE, { x: MARGIN, top: y, width: freeTextWidth });
  }
  const label = pdfFr.footer.page(page.index, page.count);
  const width = textWidth(canvas, label, STYLE);
  drawText(canvas, label, STYLE, { x: PAGE_WIDTH - MARGIN - width, top: y, width: width + 1 });
};
