import { rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { PAGE_HEIGHT } from "./page-geometry";

export type FontWeight = "regular" | "semibold" | "bold" | "extrabold";

export type EmbeddedFonts = Readonly<Record<FontWeight, PDFFont>>;

export type Canvas = { readonly page: PDFPage; readonly fonts: EmbeddedFonts };

export type TextStyle = {
  readonly size: number;
  readonly weight: FontWeight;
  readonly color: string;
  readonly lineHeight?: number;
};

export type StyledRun = { readonly text: string; readonly weight: FontWeight };

const LINE_HEIGHT_RATIO = 1.45;
const BASELINE_RATIO = 0.78;

export const colorOf = (hex: string): RGB => {
  const value = Number.parseInt(hex.slice(1), 16);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
};

const lineHeightOf = (style: TextStyle) => style.size * (style.lineHeight ?? LINE_HEIGHT_RATIO);

type Word = { readonly text: string; readonly weight: FontWeight };

const NARROW_BEFORE = /[ \u00A0]([:;!?%»€])/g;
const NARROW_AFTER = /« /g;

export const frenchSpacing = (text: string) =>
  text.replaceAll(NARROW_BEFORE, "\u00A0$1").replaceAll(NARROW_AFTER, "«\u00A0");

const wordsOf = (runs: readonly StyledRun[]): readonly Word[] =>
  runs.flatMap((run) =>
    frenchSpacing(run.text)
      .split(/([ \t]+)/)
      .filter((part) => part !== "")
      .map((part) => ({ text: part, weight: run.weight })),
  );

export const wrapRuns = (
  fonts: EmbeddedFonts,
  runs: readonly StyledRun[],
  size: number,
  width: number,
): readonly (readonly StyledRun[])[] => {
  const lines: StyledRun[][] = [[]];
  let lineWidth = 0;
  for (const word of wordsOf(runs)) {
    const wordWidth = fonts[word.weight].widthOfTextAtSize(word.text, size);
    const isSpace = /^[ \t]+$/.test(word.text);
    const current = lines.at(-1) ?? [];
    if (!isSpace && lineWidth + wordWidth > width && current.length > 0) {
      lines.push([{ text: word.text, weight: word.weight }]);
      lineWidth = wordWidth;
      continue;
    }
    if (isSpace && current.length === 0) {
      continue;
    }
    current.push({ text: isSpace ? " " : word.text, weight: word.weight });
    lineWidth += isSpace ? fonts[word.weight].widthOfTextAtSize(" ", size) : wordWidth;
  }
  return lines.map((line) => trimEnd(line));
};

const trimEnd = (line: readonly StyledRun[]) => {
  const last = line.at(-1);
  return last !== undefined && last.text === " " ? line.slice(0, -1) : line;
};

export const runsHeight = (
  fonts: EmbeddedFonts,
  runs: readonly StyledRun[],
  style: TextStyle,
  width: number,
) => wrapRuns(fonts, runs, style.size, width).length * lineHeightOf(style);

export const drawRuns = (
  canvas: Canvas,
  runs: readonly StyledRun[],
  style: TextStyle,
  box: { readonly x: number; readonly top: number; readonly width: number },
) => {
  const lineHeight = lineHeightOf(style);
  const lines = wrapRuns(canvas.fonts, runs, style.size, box.width);
  lines.forEach((line, index) => {
    const baseline =
      box.top + index * lineHeight + (lineHeight - style.size) / 2 + style.size * BASELINE_RATIO;
    let x = box.x;
    for (const piece of line) {
      const font = canvas.fonts[piece.weight];
      canvas.page.drawText(piece.text, {
        x,
        y: PAGE_HEIGHT - baseline,
        size: style.size,
        font,
        color: colorOf(style.color),
      });
      x += font.widthOfTextAtSize(piece.text, style.size);
    }
  });
  return lines.length * lineHeight;
};

export const drawText = (
  canvas: Canvas,
  text: string,
  style: TextStyle,
  box: { readonly x: number; readonly top: number; readonly width: number },
) =>
  text.split("\n").reduce(
    (height, paragraph) =>
      height +
      drawRuns(canvas, [{ text: paragraph, weight: style.weight }], style, {
        ...box,
        top: box.top + height,
      }),
    0,
  );

export const textHeight = (fonts: EmbeddedFonts, text: string, style: TextStyle, width: number) =>
  text
    .split("\n")
    .reduce(
      (height, paragraph) =>
        height + runsHeight(fonts, [{ text: paragraph, weight: style.weight }], style, width),
      0,
    );

export const textWidth = (canvas: Canvas, text: string, style: TextStyle) =>
  canvas.fonts[style.weight].widthOfTextAtSize(text, style.size);
