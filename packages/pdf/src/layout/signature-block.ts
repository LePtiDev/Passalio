import type { PDFImage } from "pdf-lib";
import { pdfFr } from "../fr";
import { SMALL_LABEL, VALUE, type Block } from "./block";
import { CONTENT_WIDTH, MARGIN, PALETTE } from "./page-geometry";
import { drawBox, drawImage } from "./shapes";
import { drawText, type Canvas } from "./text";

export type SignatureCard = {
  readonly label: string;
  readonly name: string;
  readonly image: PDFImage | null;
  readonly note: string;
};

const GAP = 9;
const CARD_HEIGHT = 92;
const IMAGE_HEIGHT = 40;
const CARD_WIDTH = (CONTENT_WIDTH - GAP) / 2;

const drawCard = (canvas: Canvas, card: SignatureCard, x: number, top: number) => {
  const isAbsent = card.image === null;
  drawBox(canvas, {
    x,
    top,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    radius: 7.5,
    border: isAbsent ? PALETTE.dashed : PALETTE.border,
    isDashed: isAbsent,
  });
  const inner = { x: x + 10.5, width: CARD_WIDTH - 21 };
  drawText(canvas, card.label, SMALL_LABEL, { ...inner, top: top + 8 });
  drawText(canvas, card.name, VALUE, { ...inner, top: top + 19 });
  const imageTop = top + 33;
  if (card.image === null) {
    drawText(
      canvas,
      pdfFr.signatures.customerAbsent,
      { ...VALUE, color: PALETTE.slate },
      { ...inner, top: imageTop + IMAGE_HEIGHT / 2 - 6 },
    );
  } else {
    drawImage(canvas, card.image, { x: inner.x, top: imageTop, width: 130, height: IMAGE_HEIGHT });
  }
  drawText(canvas, card.note, SMALL_LABEL, { ...inner, top: imageTop + IMAGE_HEIGHT + 4 });
};

export const signaturesBlock = (technician: SignatureCard, customer: SignatureCard): Block => ({
  height: () => CARD_HEIGHT,
  isPinnedToBottom: true,
  draw: (canvas, top) => {
    drawCard(canvas, technician, MARGIN, top);
    drawCard(canvas, customer, MARGIN + CARD_WIDTH + GAP, top);
  },
});
