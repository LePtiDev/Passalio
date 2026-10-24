import type { Field } from "../certificate-equipment";
import type { CertificateContent } from "../certificate-content";
import { pdfFr } from "../fr";
import { BODY, drawLabel, LABEL_HEIGHT, SMALL_LABEL, VALUE, type Block } from "./block";
import { CONTENT_WIDTH, MARGIN, PALETTE, type Theme } from "./page-geometry";
import { drawBox, drawIcon, drawLine } from "./shapes";
import { drawText, textHeight, type Canvas, type TextStyle } from "./text";

const COLUMN_GAP = 7.5;

const columnWidth = (count: number, gap = COLUMN_GAP) =>
  (CONTENT_WIDTH - gap * (count - 1)) / count;

export const doNotUseBlock = (warning: NonNullable<CertificateContent["doNotUse"]>): Block => {
  const textWidth = CONTENT_WIDTH - 50;
  const title: TextStyle = {
    size: 10.5,
    weight: "extrabold",
    color: PALETTE.danger,
    lineHeight: 1.3,
  };
  const body: TextStyle = { ...BODY, color: PALETTE.dangerInk };
  const height = (canvas: Canvas) =>
    textHeight(canvas.fonts, warning.title.toUpperCase(), title, textWidth) +
    textHeight(canvas.fonts, warning.body, body, textWidth) +
    20;
  return {
    height,
    draw: (canvas, top) => {
      drawBox(canvas, {
        x: MARGIN,
        top,
        width: CONTENT_WIDTH,
        height: height(canvas),
        radius: 7.5,
        fill: PALETTE.dangerSoft,
        border: PALETTE.danger,
        borderWidth: 1.5,
      });
      drawIcon(canvas, "warning", {
        x: MARGIN + 12,
        top: top + 10,
        size: 16.5,
        color: PALETTE.danger,
      });
      const x = MARGIN + 38;
      const titleHeight = drawText(canvas, warning.title.toUpperCase(), title, {
        x,
        top: top + 10,
        width: textWidth,
      });
      drawText(canvas, warning.body, body, { x, top: top + 10 + titleHeight, width: textWidth });
    },
  };
};

export const legalBasisBlock = (): Block => {
  const style: TextStyle = { size: 8.25, weight: "regular", color: PALETTE.slate };
  return {
    height: (canvas) =>
      textHeight(canvas.fonts, pdfFr.certificate.legalBasis, style, CONTENT_WIDTH),
    draw: (canvas, top) => {
      drawText(canvas, pdfFr.certificate.legalBasis, style, {
        x: MARGIN,
        top,
        width: CONTENT_WIDTH,
      });
    },
  };
};

const DATE_LABEL: TextStyle = { ...SMALL_LABEL, weight: "semibold" };
const DATE_VALUE: TextStyle = { ...VALUE, size: 9.75 };
const DATE_PADDING = 7;

export const datesBlock = (dates: readonly Field[], theme: Theme): Block => {
  const width = columnWidth(3);
  const innerWidth = width - 18;
  const labelHeight = (canvas: Canvas) =>
    Math.max(
      ...dates.map((field) =>
        textHeight(canvas.fonts, field.label.toUpperCase(), DATE_LABEL, innerWidth),
      ),
    );
  const height = (canvas: Canvas) =>
    labelHeight(canvas) +
    Math.max(
      ...dates.map((field) => textHeight(canvas.fonts, field.value, DATE_VALUE, innerWidth)),
    ) +
    2 * DATE_PADDING;
  return {
    height,
    draw: (canvas, top) => {
      dates.forEach((field, index) => {
        const x = MARGIN + index * (width + COLUMN_GAP);
        const isHighlighted = index === dates.length - 1;
        drawBox(canvas, {
          x,
          top,
          width,
          height: height(canvas),
          radius: 6,
          border: isHighlighted ? theme.accent : PALETTE.border,
          ...(isHighlighted ? { fill: theme.accentSoft } : {}),
        });
        const color = isHighlighted ? theme.accent : PALETTE.muted;
        const box = { x: x + 9, width: innerWidth };
        drawText(
          canvas,
          field.label.toUpperCase(),
          { ...DATE_LABEL, color },
          { ...box, top: top + DATE_PADDING },
        );
        drawText(
          canvas,
          field.value,
          isHighlighted ? { ...DATE_VALUE, weight: "bold", color: theme.accent } : DATE_VALUE,
          { ...box, top: top + DATE_PADDING + labelHeight(canvas) },
        );
      });
    },
  };
};

export const partiesBlock = (content: CertificateContent, theme: Theme): Block => {
  const width = columnWidth(2);
  const columns = [
    {
      label: pdfFr.certificate.customer,
      name: content.customer.name,
      address: content.customer.address,
    },
    { label: pdfFr.certificate.site, name: content.site.label, address: content.site.address },
  ];
  const addressStyle: TextStyle = {
    size: 9,
    weight: "regular",
    color: PALETTE.slate,
    lineHeight: 1.45,
  };
  const columnHeight = (canvas: Canvas, column: (typeof columns)[number]) =>
    LABEL_HEIGHT +
    textHeight(canvas.fonts, column.name, VALUE, width) +
    textHeight(canvas.fonts, column.address, addressStyle, width);
  return {
    height: (canvas) => Math.max(...columns.map((column) => columnHeight(canvas, column))),
    draw: (canvas, top) => {
      columns.forEach((column, index) => {
        const x = MARGIN + index * (width + COLUMN_GAP);
        drawLabel(canvas, column.label, theme, x, top);
        const nameHeight = drawText(canvas, column.name, VALUE, {
          x,
          top: top + LABEL_HEIGHT,
          width,
        });
        drawText(canvas, column.address, addressStyle, {
          x,
          top: top + LABEL_HEIGHT + nameHeight,
          width,
        });
      });
    },
  };
};

const GRID_COLUMNS = 4;
const CELL_HEIGHT = 31;

export const equipmentBlock = (fields: readonly Field[], theme: Theme): Block => {
  const rows = Math.ceil(fields.length / GRID_COLUMNS);
  const width = CONTENT_WIDTH / GRID_COLUMNS;
  return {
    height: () => LABEL_HEIGHT + rows * CELL_HEIGHT,
    draw: (canvas, top) => {
      drawLabel(canvas, pdfFr.certificate.equipment, theme, MARGIN, top);
      const gridTop = top + LABEL_HEIGHT;
      drawBox(canvas, {
        x: MARGIN,
        top: gridTop,
        width: CONTENT_WIDTH,
        height: rows * CELL_HEIGHT,
        radius: 6,
        border: PALETTE.border,
      });
      for (let row = 1; row < rows; row += 1) {
        drawLine(canvas, {
          x: MARGIN,
          top: gridTop + row * CELL_HEIGHT,
          width: CONTENT_WIDTH,
          color: PALETTE.divider,
        });
      }
      fields.forEach((field, index) => {
        const x = MARGIN + (index % GRID_COLUMNS) * width;
        const cellTop = gridTop + Math.floor(index / GRID_COLUMNS) * CELL_HEIGHT;
        drawText(canvas, field.label, SMALL_LABEL, {
          x: x + 9,
          top: cellTop + 6,
          width: width - 18,
        });
        drawText(
          canvas,
          field.value,
          { ...VALUE, size: 9 },
          { x: x + 9, top: cellTop + 16, width: width - 18 },
        );
      });
    },
  };
};
