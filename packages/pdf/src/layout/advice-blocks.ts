import type { AdviceCard } from "../advice-fr";
import { pdfFr } from "../fr";
import { type Block } from "./block";
import { paragraphBlock } from "./inspection-blocks";
import { CONTENT_WIDTH, MARGIN, PALETTE, type Theme } from "./page-geometry";
import { drawBox } from "./shapes";
import { drawText, textHeight, type Canvas, type TextStyle } from "./text";

const GAP = 6;
const PADDING = 9;
const CARD_WIDTH = (CONTENT_WIDTH - GAP) / 2;
const TEXT_WIDTH = CARD_WIDTH - 2 * PADDING;
const CARD_TITLE: TextStyle = { size: 9, weight: "bold", color: PALETTE.ink, lineHeight: 1.35 };
const CARD_BODY: TextStyle = {
  size: 8.25,
  weight: "regular",
  color: PALETTE.body,
  lineHeight: 1.45,
};
const NOTE: TextStyle = { size: 8.25, weight: "regular", color: PALETTE.muted, lineHeight: 1.45 };

const cardHeight = (canvas: Canvas, card: AdviceCard) =>
  textHeight(canvas.fonts, card.title, CARD_TITLE, TEXT_WIDTH) +
  3 +
  textHeight(canvas.fonts, card.body, CARD_BODY, TEXT_WIDTH) +
  2 * PADDING -
  2;

const pairsOf = (cards: readonly AdviceCard[]) =>
  Array.from({ length: Math.ceil(cards.length / 2) }, (_, index) =>
    cards.slice(index * 2, index * 2 + 2),
  );

const cardRowBlock = (pair: readonly AdviceCard[]): Block => {
  const height = (canvas: Canvas) => Math.max(...pair.map((card) => cardHeight(canvas, card)));
  return {
    height,
    gapAfter: GAP,
    draw: (canvas, top) => {
      pair.forEach((card, index) => {
        const x = MARGIN + index * (CARD_WIDTH + GAP);
        drawBox(canvas, {
          x,
          top,
          width: CARD_WIDTH,
          height: height(canvas),
          radius: 7.5,
          border: PALETTE.border,
        });
        const titleHeight = drawText(canvas, card.title, CARD_TITLE, {
          x: x + PADDING,
          top: top + PADDING - 1,
          width: TEXT_WIDTH,
        });
        drawText(canvas, card.body, CARD_BODY, {
          x: x + PADDING,
          top: top + PADDING + titleHeight + 2,
          width: TEXT_WIDTH,
        });
      });
    },
  };
};

const noteBlock = (text: string): Block => ({
  height: (canvas) => textHeight(canvas.fonts, text, NOTE, CONTENT_WIDTH),
  draw: (canvas, top) => {
    drawText(canvas, text, NOTE, { x: MARGIN, top, width: CONTENT_WIDTH });
  },
});

const adviceTitleBlock = (theme: Theme): Block => {
  const title: TextStyle = { size: 11.25, weight: "bold", color: theme.accent, lineHeight: 1.3 };
  return {
    height: (canvas) => textHeight(canvas.fonts, pdfFr.advicePage.title, title, CONTENT_WIDTH) + 4,
    draw: (canvas, top) => {
      drawText(canvas, pdfFr.advicePage.title, title, { x: MARGIN, top, width: CONTENT_WIDTH });
    },
  };
};

const keepBlock = (): Block => {
  const text = pdfFr.advicePage;
  const body: TextStyle = { size: 8.5, weight: "regular", color: PALETTE.body, lineHeight: 1.5 };
  const height = (canvas: Canvas) =>
    textHeight(canvas.fonts, text.keepBody, body, CONTENT_WIDTH - 21) + 30;
  return {
    height,
    draw: (canvas, top) => {
      drawBox(canvas, {
        x: MARGIN,
        top,
        width: CONTENT_WIDTH,
        height: height(canvas),
        radius: 7.5,
        fill: PALETTE.panel,
      });
      drawText(
        canvas,
        text.keepTitle,
        { ...body, weight: "bold", color: PALETTE.ink },
        { x: MARGIN + 10.5, top: top + 8, width: CONTENT_WIDTH - 21 },
      );
      drawText(canvas, text.keepBody, body, {
        x: MARGIN + 10.5,
        top: top + 21,
        width: CONTENT_WIDTH - 21,
      });
    },
  };
};

export const adviceBlocks = (cards: readonly AdviceCard[], theme: Theme): readonly Block[] => [
  adviceTitleBlock(theme),
  noteBlock(pdfFr.advicePage.intro),
  ...pairsOf(cards).map((pair) => cardRowBlock(pair)),
  noteBlock(pdfFr.advicePage.disclaimer),
  keepBlock(),
];

export const companyMessageBlock = (message: string, theme: Theme): Block => ({
  ...paragraphBlock(pdfFr.certificate.companyMessage, message, theme),
  isPinnedToBottom: true,
});
