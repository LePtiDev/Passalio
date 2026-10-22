import { Ellipsis } from "lucide-react";
import { useCallback, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { identityFr } from "../../fr";
import { ConfirmDialog } from "./confirm-dialog";

type PendingConfirmation = "transfer" | "remove" | null;

type MemberActionsMenuProps = {
  readonly name: string;
  readonly canTransfer: boolean;
  readonly isDisabled: boolean;
  readonly onTransfer: () => void;
  readonly onRemove: () => void;
};

const ITEM_CLASS = "min-h-12 text-base lg:min-h-8 lg:text-[13px]";

const text = identityFr.team;

export const MemberActionsMenu = ({
  name,
  canTransfer,
  isDisabled,
  onTransfer,
  onRemove,
}: MemberActionsMenuProps) => {
  const [confirmation, setConfirmation] = useState<PendingConfirmation>(null);
  const askTransfer = useCallback(() => setConfirmation("transfer"), []);
  const askRemove = useCallback(() => setConfirmation("remove"), []);
  const closeConfirmation = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setConfirmation(null);
    }
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={text.actionsFor(name)}
          disabled={isDisabled}
          className="flex size-12 items-center justify-center rounded-lg text-[#64748B] outline-none hover:bg-[#EEF3F8] focus-visible:ring-2 focus-visible:ring-ring lg:size-9"
        >
          <Ellipsis aria-hidden="true" className="size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {canTransfer ? (
            <DropdownMenuItem className={ITEM_CLASS} onSelect={askTransfer}>
              {text.transfer}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem className={ITEM_CLASS} variant="destructive" onSelect={askRemove}>
            {text.remove}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        isOpen={confirmation === "transfer"}
        title={text.transferTitle(name)}
        description={text.transferText}
        confirmLabel={text.transferConfirm}
        onOpenChange={closeConfirmation}
        onConfirm={onTransfer}
      />
      <ConfirmDialog
        isOpen={confirmation === "remove"}
        title={text.removeTitle(name)}
        description={text.removeText}
        confirmLabel={text.removeConfirm}
        isDestructive
        onOpenChange={closeConfirmation}
        onConfirm={onRemove}
      />
    </>
  );
};
