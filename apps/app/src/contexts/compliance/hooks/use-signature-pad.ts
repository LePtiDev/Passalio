import SignaturePad from "signature_pad";
import { useCallback, useEffect, useRef, type RefObject } from "react";

const MAX_PIXEL_RATIO = 2;

const PEN_COLOR = "#0F2A44";

const fitCanvas = (canvas: HTMLCanvasElement, pad: SignaturePad) => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const strokes = pad.toData();
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d")?.scale(ratio, ratio);
  pad.fromData(strokes);
};

export const useSignaturePad = ({
  isEnabled,
  onDraw,
}: {
  readonly isEnabled: boolean;
  readonly onDraw: (image: string) => void;
}): {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly clear: () => void;
} => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const onDrawRef = useRef(onDraw);

  useEffect(() => {
    onDrawRef.current = onDraw;
  }, [onDraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || !isEnabled) {
      return undefined;
    }
    const pad = new SignaturePad(canvas, { penColor: PEN_COLOR, minWidth: 1, maxWidth: 2.6 });
    padRef.current = pad;
    fitCanvas(canvas, pad);
    const draw = () => onDrawRef.current(pad.toDataURL("image/png"));
    pad.addEventListener("endStroke", draw);
    const observer = new ResizeObserver(() => fitCanvas(canvas, pad));
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      pad.removeEventListener("endStroke", draw);
      pad.off();
      padRef.current = null;
    };
  }, [isEnabled]);

  const clear = useCallback(() => padRef.current?.clear(), []);
  return { canvasRef, clear };
};
