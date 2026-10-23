import { Copy, X } from "lucide-react";
import { useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SIGN_UP_PATH } from "@/lib/session";
import type { AccountFilter } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
} from "../admin-styles";
import { ACCOUNT_GRID_CLASS } from "./account-row";

const text = backofficeFr.accounts;

const ROWS = ["a", "b", "c", "d", "e", "f"];

export const AccountsSkeleton = () => (
  <ul className={ADMIN_CARD_CLASS} aria-busy="true">
    {ROWS.map((key) => (
      <li
        key={key}
        className={cn(
          ACCOUNT_GRID_CLASS,
          "min-h-[72px] border-b border-[#EEF2F6] px-4 py-3 last:border-b-0 lg:min-h-[52px]",
        )}
      >
        <span className="flex items-center gap-3">
          <Skeleton className="hidden size-7 rounded-full lg:block" />
          <span className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </span>
        </span>
        <Skeleton className="hidden h-8 w-24 lg:block" />
        <Skeleton className="hidden h-6 w-28 rounded-full lg:block" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="hidden h-8 w-24 lg:block" />
        <span className="hidden lg:block" />
      </li>
    ))}
  </ul>
);

type AccountsEmptyProps = {
  readonly search: string;
  readonly filter: AccountFilter;
  readonly onClearSearch: () => void;
  readonly onShowAll: () => void;
};

const EmptyFrame = ({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed border-[#D5DDE6] bg-white px-6 py-8 text-center lg:rounded-xl">
    <p className="text-[15px] font-bold">{title}</p>
    <p className="max-w-md text-[13px] text-[#475569]">{description}</p>
    <div className="flex flex-wrap justify-center gap-2">{children}</div>
  </div>
);

export const AccountsEmpty = ({ search, filter, onClearSearch, onShowAll }: AccountsEmptyProps) => {
  const copySignUpLink = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${SIGN_UP_PATH}`);
    toast.success(text.signUpLinkCopied);
  }, []);
  if (search !== "") {
    return (
      <EmptyFrame title={text.searchEmptyTitle(search)} description={text.searchEmptyText}>
        <Button variant="outline" className={ADMIN_SECONDARY_BUTTON_CLASS} onClick={onClearSearch}>
          <X aria-hidden="true" />
          {text.clearSearch}
        </Button>
      </EmptyFrame>
    );
  }
  if (filter !== "all") {
    return (
      <EmptyFrame title={text.filterEmpty[filter]} description={text.filterEmptyText}>
        <Button variant="outline" className={ADMIN_SECONDARY_BUTTON_CLASS} onClick={onShowAll}>
          {text.showAll}
        </Button>
      </EmptyFrame>
    );
  }
  return (
    <EmptyFrame title={text.filterEmpty.all} description={text.allEmptyText}>
      <Button className={ADMIN_PRIMARY_BUTTON_CLASS} onClick={copySignUpLink}>
        <Copy aria-hidden="true" />
        {text.copySignUpLink}
      </Button>
    </EmptyFrame>
  );
};
