import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { configurationFr } from "../../fr-configuration";
import { useProspectFilters } from "../../hooks/use-sales-queries";
import { LABEL_CLASS, SELECT_TRIGGER_CLASS } from "../sales-styles";

const ITEM_CLASS = "min-h-12 text-base lg:min-h-8 lg:text-[13px]";

type MemberSelectProps = {
  readonly id: string;
  readonly selfId: string;
  readonly value: string;
  readonly onChange: (userId: string) => void;
};

export const MemberSelect = ({ id, selfId, value, onChange }: MemberSelectProps) => {
  const filters = useProspectFilters();
  const members = filters.data?.owners ?? [];
  return (
    <span className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-2">
      <Label htmlFor={id} className={LABEL_CLASS}>
        {configurationFr.member}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={!filters.isSuccess}>
        <SelectTrigger id={id} className={cn(SELECT_TRIGGER_CLASS, "lg:w-56")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id} className={ITEM_CLASS}>
              {configurationFr.memberOption(member.name, member.id === selfId)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  );
};
