import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { identityFr } from "../../fr";

type TeamEmptyStateProps = {
  readonly title: string;
  readonly text: string;
  readonly onInvite: (() => void) | null;
};

export const TeamEmptyState = ({ title, text, onInvite }: TeamEmptyStateProps) => (
  <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-[#D5DDE6] bg-white p-4 lg:rounded-xl lg:p-5">
    <span className="flex flex-col gap-1">
      <strong className="text-[15px] lg:text-sm">{title}</strong>
      <span className="text-sm text-[#475569] lg:text-[13px]">{text}</span>
    </span>
    {onInvite === null ? null : (
      <Button onClick={onInvite}>
        <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
        {identityFr.team.emptyAction}
      </Button>
    )}
  </div>
);
