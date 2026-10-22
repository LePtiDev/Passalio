import { LOGO_CONTENT_TYPES, LOGO_MAX_BYTES, type BrandColor } from "@passalio/shared";
import { useCallback, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useUploadLogo } from "../../hooks/use-organization";
import { onboardingFr } from "../../onboarding-fr";
import { AUTH_LABEL_CLASS } from "../auth-styles";
import { OrganizationMark } from "./organization-mark";

const text = onboardingFr.documents;

const ACCEPTED_TYPES = LOGO_CONTENT_TYPES.join(",");

type LogoPickerProps = {
  readonly name: string;
  readonly brandColor: BrandColor;
  readonly logoUrl: string | null;
  readonly onUploaded: () => void;
};

export const LogoPicker = ({ name, brandColor, logoUrl, onUploaded }: LogoPickerProps) => {
  const uploadLogo = useUploadLogo();
  const { mutate } = uploadLogo;

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file === undefined) {
        return;
      }
      if (file.size > LOGO_MAX_BYTES) {
        toast.error(text.logoTooBig);
        return;
      }
      mutate(file, { onSuccess: onUploaded });
    },
    [mutate, onUploaded],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className={AUTH_LABEL_CLASS}>{text.logoLabel}</span>
      <label
        htmlFor="logo"
        className="flex min-h-12 cursor-pointer items-center gap-3.5 rounded-[10px] border border-dashed border-[#CBD5E1] bg-[#FBFCFD] p-3.5 focus-within:ring-[3px] focus-within:ring-ring/50"
      >
        <OrganizationMark name={name} brandColor={brandColor} logoUrl={logoUrl} size="large" />
        <span className="flex flex-col gap-0.5" aria-live="polite">
          <span className="text-sm font-semibold lg:text-[13px]">
            {uploadLogo.isPending
              ? text.logoUploading
              : logoUrl === null
                ? text.logoAction
                : text.logoReplace}
          </span>
          <span className="text-[13px] text-[#64748B] lg:text-xs">{text.logoHint}</span>
        </span>
        <input
          id="logo"
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={onChange}
          className="sr-only"
        />
      </label>
    </div>
  );
};
