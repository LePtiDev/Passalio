import { TEAM_SIZES } from "@passalio/shared";
import { useCallback } from "react";
import { useController, type Control } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { onboardingFr, TEAM_SIZE_LABELS } from "../../onboarding-fr";
import type { CompanyFormInput } from "./company-form-schema";

export const TeamSizeSelect = ({ control }: { readonly control: Control<CompanyFormInput> }) => {
  const { field } = useController({ control, name: "teamSize" });
  const { onChange } = field;
  const onValueChange = useCallback(
    (value: string) => onChange(TEAM_SIZES.find((size) => size === value) ?? null),
    [onChange],
  );
  return (
    <Select value={field.value ?? ""} onValueChange={onValueChange}>
      <SelectTrigger
        id="team-size"
        className="h-12 w-full rounded-[10px] border-[#D5DDE6] text-base data-[size=default]:h-12 lg:rounded-lg lg:text-sm lg:data-[size=default]:h-10"
      >
        <SelectValue placeholder={onboardingFr.company.teamSizePlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {TEAM_SIZES.map((size) => (
          <SelectItem key={size} value={size} className="min-h-12 text-base lg:min-h-9 lg:text-sm">
            {TEAM_SIZE_LABELS[size]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
