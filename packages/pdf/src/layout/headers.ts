import type { PDFImage } from "pdf-lib";
import { pdfFr } from "../fr";
import { CONTENT_WIDTH, MARGIN, PAGE_WIDTH, PALETTE, type Theme } from "./page-geometry";
import { drawBox, drawImage, drawLine } from "./shapes";
import { drawText, textHeight, textWidth, type Canvas, type TextStyle } from "./text";

export type Letterhead = {
  readonly companyName: string;
  readonly address: string;
  readonly contactLine: string | null;
  readonly logo: PDFImage | null;
  readonly initials: string;
  readonly number: string;
};

const LOGO_SIZE = 42;
const TEXT_WIDTH = 300;

const drawLogo = (canvas: Canvas, letterhead: Letterhead, theme: Theme, top: number) => {
  const frame = { x: MARGIN, top, width: LOGO_SIZE, height: LOGO_SIZE };
  const background = theme.isBanner || letterhead.logo !== null ? PALETTE.white : theme.accent;
  drawBox(canvas, { ...frame, radius: 9, fill: background });
  if (letterhead.logo !== null) {
    drawImage(canvas, letterhead.logo, {
      ...frame,
      x: frame.x + 3,
      top: top + 3,
      width: 36,
      height: 36,
    });
    return;
  }
  const style: TextStyle = {
    size: 15,
    weight: "extrabold",
    color: theme.isBanner ? theme.accent : PALETTE.white,
    lineHeight: 1,
  };
  const width = textWidth(canvas, letterhead.initials, style);
  drawText(canvas, letterhead.initials, style, {
    x: MARGIN + (LOGO_SIZE - width) / 2,
    top: top + (LOGO_SIZE - 15) / 2,
    width: LOGO_SIZE,
  });
};

const identityLines = (letterhead: Letterhead, theme: Theme) => {
  const color = theme.isBanner ? PALETTE.white : PALETTE.slate;
  const detail: TextStyle = { size: 8.25, weight: "regular", color };
  const name: TextStyle = {
    size: 12.75,
    weight: "bold",
    color: theme.isBanner ? PALETTE.white : PALETTE.ink,
    lineHeight: 1.3,
  };
  const lines: readonly (readonly [string, TextStyle])[] = [
    [letterhead.companyName, name],
    [letterhead.address, detail],
    ...(letterhead.contactLine === null ? [] : [[letterhead.contactLine, detail] as const]),
  ];
  return lines;
};

const IDENTITY_X = MARGIN + LOGO_SIZE + 10.5;

const identityHeight = (canvas: Canvas, letterhead: Letterhead, theme: Theme) =>
  identityLines(letterhead, theme).reduce(
    (height, [text, style]) => height + textHeight(canvas.fonts, text, style, TEXT_WIDTH),
    0,
  );

const drawIdentity = (canvas: Canvas, letterhead: Letterhead, theme: Theme, top: number) =>
  identityLines(letterhead, theme).reduce(
    (y, [text, style]) =>
      y + drawText(canvas, text, style, { x: IDENTITY_X, top: y, width: TEXT_WIDTH }),
    top,
  );

const drawTitle = (canvas: Canvas, letterhead: Letterhead, theme: Theme, top: number) => {
  const titleStyle: TextStyle = {
    size: 15,
    weight: "extrabold",
    color: theme.isBanner ? PALETTE.white : theme.accent,
    lineHeight: 1.3,
  };
  const numberStyle: TextStyle = {
    size: 9,
    weight: "semibold",
    color: theme.isBanner ? PALETTE.white : PALETTE.slate,
  };
  const title = pdfFr.certificate.title;
  const number = pdfFr.certificate.number(letterhead.number);
  const right = PAGE_WIDTH - MARGIN;
  const titleWidth = textWidth(canvas, title, titleStyle);
  const numberWidth = textWidth(canvas, number, numberStyle);
  const titleHeight = drawText(canvas, title, titleStyle, {
    x: right - titleWidth,
    top,
    width: titleWidth + 1,
  });
  drawText(canvas, number, numberStyle, {
    x: right - numberWidth,
    top: top + titleHeight,
    width: numberWidth + 1,
  });
};

export const drawLetterhead = (canvas: Canvas, letterhead: Letterhead, theme: Theme) => {
  const top = theme.isBanner ? 21 : 24;
  const height = Math.max(identityHeight(canvas, letterhead, theme), LOGO_SIZE);
  const bottom = top + height + (theme.isBanner ? 18 : 12);
  if (theme.isBanner) {
    drawBox(canvas, { x: 0, top: 0, width: PAGE_WIDTH, height: bottom, fill: theme.accent });
  }
  drawIdentity(canvas, letterhead, theme, top);
  drawLogo(canvas, letterhead, theme, top);
  drawTitle(canvas, letterhead, theme, top);
  if (!theme.isBanner) {
    drawBox(canvas, {
      x: MARGIN,
      top: bottom,
      width: CONTENT_WIDTH,
      height: 1.5,
      fill: theme.accent,
    });
  }
  return bottom + 13.5;
};

export const drawSlimHeader = (
  canvas: Canvas,
  header: { readonly companyName: string; readonly label: string },
  theme: Theme,
) => {
  drawBox(canvas, { x: 0, top: 0, width: PAGE_WIDTH, height: 4.5, fill: theme.accent });
  drawText(
    canvas,
    header.companyName,
    { size: 9.75, weight: "bold", color: PALETTE.ink },
    { x: MARGIN, top: 16, width: 250 },
  );
  const labelStyle: TextStyle = { size: 9, weight: "regular", color: PALETTE.slate };
  const width = textWidth(canvas, header.label, labelStyle);
  drawText(canvas, header.label, labelStyle, {
    x: PAGE_WIDTH - MARGIN - width,
    top: 16.5,
    width: width + 1,
  });
  drawLine(canvas, { x: 0, top: 38, width: PAGE_WIDTH, color: PALETTE.border });
  return 52;
};
