import { useCallback } from "react";
import { useController } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salesFr } from "../../fr";
import { useProspectFilters } from "../../hooks/use-sales-queries";
import { LABEL_CLASS, SELECT_TRIGGER_CLASS } from "../sales-styles";
import type { CompanyFormValues } from "./company-form-schema";

const NOBODY = "nobody";

const ITEM_CLASS = "min-h-12 text-base lg:min-h-8 lg:text-[13px]";

export const OwnerField = () => {
  const filters = useProspectFilters();
  const { field } = useController<CompanyFormValues, "ownerUserId">({ name: "ownerUserId" });
  const { onChange } = field;
  const change = useCallback(
    (value: string) => onChange(value === NOBODY ? "" : value),
    [onChange],
  );
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="ownerUserId" className={LABEL_CLASS}>
        {salesFr.companyForm.owner}
      </Label>
      <Select value={field.value === "" ? NOBODY : field.value} onValueChange={change}>
        <SelectTrigger id="ownerUserId" className={SELECT_TRIGGER_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOBODY} className={ITEM_CLASS}>
            {salesFr.companyForm.noOwner}
          </SelectItem>
          {(filters.data?.owners ?? []).map((owner) => (
            <SelectItem key={owner.id} value={owner.id} className={ITEM_CLASS}>
              {owner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
