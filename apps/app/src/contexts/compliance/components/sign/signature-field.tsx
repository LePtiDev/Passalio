import { useCallback, useState } from "react";
import { ERROR_TEXT_CLASS, LABEL_CLASS } from "@/components/field-styles";
import { fieldErrorId } from "@/components/form-field";
import { cn } from "@/lib/utils";
import { complianceFr } from "../../fr";
import { useSignaturePad } from "../../hooks/use-signature-pad";

const text = complianceFr.sign;

type SignatureFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly padLabel: string;
  readonly signerName: string;
  readonly actionLabel: string;
  readonly value: string | null;
  readonly savedImage: string | null;
  readonly isDisabled?: boolean;
  readonly error?: string | undefined;
  readonly onChange: (image: string | null) => void;
};

export const SignatureField = ({
  id,
  label,
  padLabel,
  signerName,
  actionLabel,
  value,
  savedImage,
  isDisabled = false,
  error,
  onChange,
}: SignatureFieldProps) => {
  const isShowingSaved = savedImage !== null && value === savedImage;
  const [hasDrawn, setHasDrawn] = useState(false);
  const draw = useCallback(
    (image: string) => {
      setHasDrawn(true);
      onChange(image);
    },
    [onChange],
  );
  const { canvasRef, clear } = useSignaturePad({
    isEnabled: !isShowingSaved && !isDisabled,
    onDraw: draw,
  });
  const reset = useCallback(() => {
    clear();
    setHasDrawn(false);
    onChange(null);
  }, [clear, onChange]);
  const caption = isShowingSaved ? text.savedSignature(signerName) : signerName;
  return (
    <div className={cn("flex flex-col gap-1.5", isDisabled && "opacity-50")}>
      <div className="flex min-h-8 items-center justify-between gap-2">
        <span id={`${id}-label`} className={LABEL_CLASS}>
          {label}
          {isDisabled ? null : (
            <span aria-hidden="true" className="ml-1 text-destructive">
              *
            </span>
          )}
        </span>
        {(isShowingSaved || hasDrawn) && !isDisabled ? (
          <button
            type="button"
            onClick={reset}
            className="-mr-2 flex h-12 items-center px-2 text-[15px] font-semibold text-[#0E7C5A] lg:h-8 lg:text-[13px]"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div
        className={cn(
          "relative flex h-[168px] flex-col rounded-[14px] border border-[#D5DDE6] bg-white px-4 pb-3 lg:h-[140px] lg:rounded-xl",
          error !== undefined && "border-[#B42318] ring-[3px] ring-[#B42318]/15",
        )}
      >
        {isShowingSaved ? (
          <img
            src={savedImage}
            alt={padLabel}
            className="min-h-0 flex-1 object-contain object-left"
          />
        ) : (
          <canvas
            ref={canvasRef}
            aria-label={padLabel}
            aria-describedby={error === undefined ? undefined : fieldErrorId(id)}
            className="min-h-0 w-full flex-1 touch-none"
          />
        )}
        {value === null && !isDisabled ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-1/3 text-center text-[15px] text-[#94A3B8] lg:text-[13px]"
          >
            {text.signHere}
          </span>
        ) : null}
        <span className="border-t border-[#E3E8EF] pt-2 text-[13px] text-[#64748B]">{caption}</span>
      </div>
      {error === undefined ? null : (
        <p id={fieldErrorId(id)} className={ERROR_TEXT_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
};
