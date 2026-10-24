import type { Check, CertificateContent } from "../certificate-content";
import type { FlueRow } from "../certificate-equipment";
import { pdfFr } from "../fr";
import { BODY, drawLabel, LABEL_HEIGHT, SMALL_LABEL, type Block } from "./block";
import { CONTENT_WIDTH, MARGIN, PALETTE, type Theme } from "./page-geometry";
import { drawBox, drawIcon, drawLine } from "./shapes";
import {
  drawRuns,
  drawText,
  runsHeight,
  textHeight,
  type Canvas,
  type StyledRun,
  type TextStyle,
} from "./text";

const COLUMN_RATIOS = [2, 1.4, 1.6] as const;
const RATIO_TOTAL = COLUMN_RATIOS.reduce((total, ratio) => total + ratio, 0);
const CELL_PADDING = 9;
const HEAD_HEIGHT = 18;
const ROW_STYLE: TextStyle = { size: 9, weight: "regular", color: PALETTE.ink, lineHeight: 1.35 };

const columnWidths = () =>
  COLUMN_RATIOS.map((ratio) => ((CONTENT_WIDTH - 2 * CELL_PADDING) * ratio) / RATIO_TOTAL);

const cellsOf = (flue: FlueRow) => [flue.designation, flue.appliance, flue.result] as const;

const rowHeight = (canvas: Canvas, flue: FlueRow) =>
  Math.max(
    ...cellsOf(flue).map((cell, index) =>
      textHeight(canvas.fonts, cell, ROW_STYLE, (columnWidths()[index] ?? 0) - 6),
    ),
  ) + 12;

export const fluesBlock = (flues: readonly FlueRow[], theme: Theme): Block => {
  const tableHeight = (canvas: Canvas) =>
    HEAD_HEIGHT + flues.reduce((height, flue) => height + rowHeight(canvas, flue), 0);
  return {
    height: (canvas) => LABEL_HEIGHT + tableHeight(canvas),
    draw: (canvas, top) => {
      drawLabel(canvas, pdfFr.certificate.flues(flues.length), theme, MARGIN, top);
      const tableTop = top + LABEL_HEIGHT;
      drawBox(canvas, {
        x: MARGIN,
        top: tableTop,
        width: CONTENT_WIDTH,
        height: tableHeight(canvas),
        radius: 6,
        border: PALETTE.border,
      });
      drawBox(canvas, {
        x: MARGIN + 0.5,
        top: tableTop + 0.5,
        width: CONTENT_WIDTH - 1,
        height: HEAD_HEIGHT - 0.5,
        radius: 5.5,
        fill: PALETTE.panel,
      });
      const widths = columnWidths();
      const xOf = (index: number) =>
        MARGIN + CELL_PADDING + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
      pdfFr.certificate.flueColumns.forEach((title, index) => {
        drawText(
          canvas,
          title,
          { ...SMALL_LABEL, weight: "semibold" },
          { x: xOf(index), top: tableTop + 5, width: widths[index] ?? 0 },
        );
      });
      let y = tableTop + HEAD_HEIGHT;
      for (const flue of flues) {
        drawLine(canvas, { x: MARGIN, top: y, width: CONTENT_WIDTH, color: PALETTE.divider });
        cellsOf(flue).forEach((cell, index) => {
          const isResult = index === 2;
          const style: TextStyle = {
            ...ROW_STYLE,
            weight: index === 0 || (isResult && !flue.isComplete) ? "semibold" : "regular",
            color: isResult && !flue.isComplete ? PALETTE.danger : PALETTE.ink,
          };
          drawText(canvas, cell, style, {
            x: xOf(index),
            top: y + 6,
            width: (widths[index] ?? 0) - 6,
          });
        });
        y += rowHeight(canvas, flue);
      }
    },
  };
};

const CHECK_TEXT_WIDTH = CONTENT_WIDTH - 40;
const CHECK_STYLE: TextStyle = { size: 9, weight: "regular", color: PALETTE.ink, lineHeight: 1.45 };

const styledRunsOf = (check: Check): readonly StyledRun[] =>
  check.runs.map((run) => ({ text: run.text, weight: run.isStrong ? "bold" : "regular" }));

export const checksBlock = (checks: readonly Check[], theme: Theme): Block => {
  const linesHeight = (canvas: Canvas) =>
    checks.reduce(
      (height, check) =>
        height + runsHeight(canvas.fonts, styledRunsOf(check), CHECK_STYLE, CHECK_TEXT_WIDTH) + 4,
      -4,
    );
  const height = (canvas: Canvas) => linesHeight(canvas) + 20;
  return {
    height,
    draw: (canvas, top) => {
      const frame = { x: MARGIN, top, width: CONTENT_WIDTH, height: height(canvas), radius: 7.5 };
      if (theme.isBanner) {
        drawBox(canvas, { ...frame, fill: theme.accentSoft });
      } else {
        drawBox(canvas, { ...frame, border: PALETTE.border });
        drawBox(canvas, {
          x: MARGIN,
          top: top + 6,
          width: 2.25,
          height: frame.height - 12,
          fill: theme.accent,
        });
      }
      let y = top + 10;
      for (const check of checks) {
        drawIcon(canvas, check.isMet ? "check" : "cross", {
          x: MARGIN + 14,
          top: y + 2,
          size: 10.5,
          color: check.isMet ? theme.accent : PALETTE.danger,
        });
        y +=
          drawRuns(canvas, styledRunsOf(check), CHECK_STYLE, {
            x: MARGIN + 31,
            top: y,
            width: CHECK_TEXT_WIDTH,
          }) + 4;
      }
    },
  };
};

export const paragraphBlock = (label: string, text: string, theme: Theme): Block => ({
  height: (canvas) => LABEL_HEIGHT + textHeight(canvas.fonts, text, BODY, CONTENT_WIDTH),
  draw: (canvas, top) => {
    drawLabel(canvas, label, theme, MARGIN, top);
    drawText(canvas, text, BODY, { x: MARGIN, top: top + LABEL_HEIGHT, width: CONTENT_WIDTH });
  },
});

export const observationsBlock = (content: CertificateContent, theme: Theme) =>
  content.observations === null
    ? []
    : [paragraphBlock(pdfFr.certificate.observations, content.observations, theme)];
