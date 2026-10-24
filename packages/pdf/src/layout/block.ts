import { PALETTE, type Theme } from "./page-geometry";
import { drawText, type Canvas, type TextStyle } from "./text";

export type Block = {
  readonly height: (canvas: Canvas) => number;
  readonly draw: (canvas: Canvas, top: number) => void;
  readonly isPinnedToBottom?: boolean;
  readonly gapAfter?: number;
};

export const LABEL_HEIGHT = 12;

export const labelStyle = (theme: Theme): TextStyle => ({
  size: 7.5,
  weight: "bold",
  color: theme.accent,
  lineHeight: 1.2,
});

export const drawLabel = (canvas: Canvas, label: string, theme: Theme, x: number, top: number) => {
  drawText(canvas, label.toUpperCase(), labelStyle(theme), { x, top, width: 400 });
};

export const SMALL_LABEL: TextStyle = {
  size: 7.5,
  weight: "regular",
  color: PALETTE.muted,
  lineHeight: 1.3,
};

export const VALUE: TextStyle = {
  size: 9,
  weight: "semibold",
  color: PALETTE.ink,
  lineHeight: 1.35,
};

export const BODY: TextStyle = { size: 9, weight: "regular", color: PALETTE.body, lineHeight: 1.5 };
