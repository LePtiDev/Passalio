import type { PDFDocument, PDFPage } from "pdf-lib";
import type { Block } from "./block";
import { PAGE_HEIGHT, PAGE_WIDTH, SECTION_GAP } from "./page-geometry";
import type { Canvas, EmbeddedFonts } from "./text";

export type Section = {
  readonly blocks: readonly Block[];
  readonly drawFirstHeader: (canvas: Canvas) => number;
  readonly drawNextHeader: (canvas: Canvas) => number;
};

type Layout = {
  readonly document: PDFDocument;
  readonly fonts: EmbeddedFonts;
  readonly contentBottom: number;
};

const newPage = (layout: Layout): Canvas => ({
  page: layout.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
  fonts: layout.fonts,
});

export const paginate = (layout: Layout, section: Section): readonly PDFPage[] => {
  let canvas = newPage(layout);
  const pages = [canvas.page];
  let y = section.drawFirstHeader(canvas);
  const breakPage = () => {
    canvas = newPage(layout);
    pages.push(canvas.page);
    y = section.drawNextHeader(canvas);
  };
  for (const block of section.blocks) {
    const height = block.height(canvas);
    if (y + height > layout.contentBottom) {
      breakPage();
    }
    const top = block.isPinnedToBottom === true ? Math.max(y, layout.contentBottom - height) : y;
    block.draw(canvas, top);
    y = top + height + (block.gapAfter ?? SECTION_GAP);
  }
  return pages;
};
