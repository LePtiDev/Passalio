import { LOGO_CONTENT_TYPES, LOGO_MAX_BYTES, type BrandColor } from "@passalio/shared";
import { Upload } from "lucide-react";
import { useCallback, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRemoveLogo } from "../../hooks/use-document-settings";
import { useUploadLogo } from "../../hooks/use-organization";
import { settingsFr } from "../../settings-fr";
import { BrandColorPicker } from "../onboarding/brand-color-picker";
import { OrganizationMark } from "../onboarding/organization-mark";

const text = settingsFr.documents;

const ACCEPTED_TYPES = LOGO_CONTENT_TYPES.join(",");

type LogoAndColorProps = {
  readonly name: string;
  readonly logoUrl: string | null;
  readonly brandColor: BrandColor;
  readonly isDisabled: boolean;
  readonly onLogoChanged: () => void;
  readonly onColorChange: (color: BrandColor) => void;
};

export const LogoAndColor = ({
  name,
  logoUrl,
  brandColor,
  isDisabled,
  onLogoChanged,
  onColorChange,
}: LogoAndColorProps) => {
  const upload = useUploadLogo();
  const remove = useRemoveLogo();
  const { mutate: uploadLogo } = upload;
  const { mutate: removeLogo } = remove;
  const choose = useCallback(
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
      uploadLogo(file, { onSuccess: onLogoChanged });
    },
    [uploadLogo, onLogoChanged],
  );
  const removeCurrent = useCallback(
    () =>
      removeLogo(undefined, {
        onSuccess: () => {
          onLogoChanged();
          toast.success(text.logoRemoved);
        },
      }),
    [removeLogo, onLogoChanged],
  );
  const isBusy = upload.isPending || remove.isPending;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <OrganizationMark name={name} brandColor={brandColor} logoUrl={logoUrl} size="huge" />
        <div className="flex flex-col gap-2">
          <span className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" disabled={isDisabled || isBusy}>
              <label htmlFor="document-logo" aria-disabled={isDisabled || isBusy}>
                <Upload aria-hidden="true" className="size-4" />
                {upload.isPending
                  ? text.uploadingLogo
                  : logoUrl === null
                    ? text.addLogo
                    : text.replaceLogo}
                <input
                  id="document-logo"
                  type="file"
                  accept={ACCEPTED_TYPES}
                  disabled={isDisabled || isBusy}
                  onChange={choose}
                  className="sr-only"
                />
              </label>
            </Button>
            {logoUrl === null ? null : (
              <Button
                type="button"
                variant="secondary"
                disabled={isDisabled || isBusy}
                onClick={removeCurrent}
              >
                {text.removeLogo}
              </Button>
            )}
          </span>
          <span className="text-[13px] text-[#64748B]">{text.logoHint}</span>
        </div>
      </div>
      <BrandColorPicker value={brandColor} onChange={onColorChange} legend={text.color} />
    </div>
  );
};
