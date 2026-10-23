import { Link, useNavigate } from "@tanstack/react-router";
import { Ellipsis } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalSession } from "@/lib/db/local-database-context";
import { useCan } from "@/lib/permissions/use-can";
import { cn } from "@/lib/utils";
import { archiveCustomer } from "../../customer-store";
import { customersFr } from "../../fr";
import { useCustomerParams } from "../../hooks/use-route-params";
import { ConfirmDialog } from "../confirm-dialog";

const text = customersFr.file;

const ITEM_CLASS = "min-h-12 lg:min-h-8";

type CustomerActionsMenuProps = {
  readonly customerId: string;
  readonly name: string;
  readonly triggerClassName: string;
};

export const CustomerActionsMenu = ({
  customerId,
  name,
  triggerClassName,
}: CustomerActionsMenuProps) => {
  const { database } = useLocalSession();
  const navigate = useNavigate();
  const canArchive = useCan("customers:archive");
  const params = useCustomerParams(customerId);
  const [isConfirming, setIsConfirming] = useState(false);
  const askArchive = useCallback(() => setIsConfirming(true), []);
  const archive = useCallback(async () => {
    try {
      await archiveCustomer(database, customerId);
      toast.success(text.archived);
      await navigate({ to: "/clients" });
    } catch {
      toast.error(text.archiveFailed);
    }
  }, [database, customerId, navigate]);
  const confirmArchive = useCallback(() => {
    void archive();
  }, [archive]);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={text.more} className={triggerClassName}>
          <Ellipsis aria-hidden="true" className="size-5 lg:size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild className={cn(ITEM_CLASS, "lg:hidden")}>
            <Link to="/clients/$customerId/modifier" params={params}>
              {text.edit}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className={ITEM_CLASS}>
            <Link to="/clients/$customerId/lieux/nouveau" params={params}>
              {text.addSite}
            </Link>
          </DropdownMenuItem>
          {canArchive ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className={ITEM_CLASS} onSelect={askArchive}>
                {text.archive}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        isOpen={isConfirming}
        title={text.archiveTitle(name)}
        description={text.archiveText}
        confirmLabel={text.archiveConfirm}
        onOpenChange={setIsConfirming}
        onConfirm={confirmArchive}
      />
    </>
  );
};
