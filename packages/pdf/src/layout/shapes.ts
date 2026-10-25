import { LineCapStyle, type PDFImage } from "pdf-lib";
import { PAGE_HEIGHT } from "./page-geometry";
import { colorOf, type Canvas } from "./text";

type BoxOptions = {
  readonly x: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly radius?: number;
  readonly fill?: string;
  readonly border?: string;
  readonly borderWidth?: number;
  readonly isDashed?: boolean;
};

const roundedPath = (width: number, height: number, radius: number) => {
  const r = Math.min(radius, width / 2, height / 2);
  return `M ${r} 0 H ${width - r} Q ${width} 0 ${width} ${r} V ${height - r} Q ${width} ${height} ${width - r} ${height} H ${r} Q 0 ${height} 0 ${height - r} V ${r} Q 0 0 ${r} 0 Z`;
};

export const drawBox = (canvas: Canvas, options: BoxOptions) => {
  canvas.page.drawSvgPath(roundedPath(options.width, options.height, options.radius ?? 0), {
    x: options.x,
    y: PAGE_HEIGHT - options.top,
    ...(options.fill === undefined ? {} : { color: colorOf(options.fill) }),
    ...(options.border === undefined
      ? {}
      : {
          borderColor: colorOf(options.border),
          borderWidth: options.borderWidth ?? 0.75,
          ...(options.isDashed === true ? { borderDashArray: [3, 2] } : {}),
        }),
  });
};

export const drawLine = (
  canvas: Canvas,
  line: {
    readonly x: number;
    readonly top: number;
    readonly width: number;
    readonly color: string;
  },
  thickness = 0.75,
) => {
  canvas.page.drawLine({
    start: { x: line.x, y: PAGE_HEIGHT - line.top },
    end: { x: line.x + line.width, y: PAGE_HEIGHT - line.top },
    thickness,
    color: colorOf(line.color),
  });
};

const ICONS = {
  check: { path: "M20 6 9 17l-5-5", width: 3 },
  cross: { path: "M18 6 6 18 M6 6l12 12", width: 3 },
  warning: {
    path: "M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z M12 9v4 M12 17h.01",
    width: 2.4,
  },
} as const;

export const drawIcon = (
  canvas: Canvas,
  icon: keyof typeof ICONS,
  place: {
    readonly x: number;
    readonly top: number;
    readonly size: number;
    readonly color: string;
  },
) => {
  canvas.page.drawSvgPath(ICONS[icon].path, {
    x: place.x,
    y: PAGE_HEIGHT - place.top,
    scale: place.size / 24,
    borderColor: colorOf(place.color),
    borderWidth: ICONS[icon].width,
    borderLineCap: LineCapStyle.Round,
  });
};

export const drawImage = (
  canvas: Canvas,
  image: PDFImage,
  frame: {
    readonly x: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  },
) => {
  const scale = Math.min(frame.width / image.width, frame.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  canvas.page.drawImage(image, {
    x: frame.x + (frame.width - width) / 2,
    y: PAGE_HEIGHT - frame.top - frame.height + (frame.height - height) / 2,
    width,
    height,
  });
};
