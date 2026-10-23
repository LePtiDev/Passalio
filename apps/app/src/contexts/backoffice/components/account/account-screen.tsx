import { Link } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorOf } from "@/lib/api-client";
import { backofficeFr } from "../../fr";
import { useAccountFile } from "../../hooks/use-backoffice-queries";
import { ADMIN_LINK_CLASS } from "../admin-styles";
import { AdminPage, type AdminTrailStep } from "../shell/admin-page";
import { AccountHeader, accountStatusLabel } from "./account-header";
import { AccountTabs, type AccountTab } from "./account-tabs";

const text = backofficeFr.account;

const BACK = { to: "/admin/comptes", label: text.back } as const;

type AccountScreenProps = {
  readonly accountId: string;
  readonly tab: AccountTab;
  readonly onTabChange: (tab: AccountTab) => void;
};

const AccountSkeleton = () => (
  <div className="flex flex-col gap-4" aria-busy="true">
    <span className="hidden flex-col gap-2 lg:flex">
      <Skeleton className="h-6 w-72" />
      <Skeleton className="h-4 w-96" />
    </span>
    <Skeleton className="h-11 w-full max-w-md rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

export const AccountScreen = ({ accountId, tab, onTabChange }: AccountScreenProps) => {
  const file = useAccountFile(accountId);
  const { refetch } = file;
  const retry = useCallback(() => void refetch(), [refetch]);
  const name = file.data?.account.name ?? "";
  const trail = useMemo<readonly AdminTrailStep[]>(
    () => [{ label: text.back, to: "/admin/comptes" }, { label: name }],
    [name],
  );
  return (
    <AdminPage
      trail={trail}
      mobileTitle={name}
      mobileSubtitle={file.data === undefined ? undefined : accountStatusLabel(file.data)}
      mobileBack={BACK}
    >
      {file.isPending ? <AccountSkeleton /> : null}
      {file.isError && apiErrorOf(file.error).code === "account_not_found" ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-[#E3E8EF] bg-white p-4">
          <p className="text-[15px] font-semibold lg:text-sm">{text.notFound}</p>
          <Link to="/admin/comptes" className={ADMIN_LINK_CLASS}>
            {text.backToList}
          </Link>
        </div>
      ) : null}
      {file.isError && apiErrorOf(file.error).code !== "account_not_found" ? (
        <ErrorState error={file.error} onRetry={retry} />
      ) : null}
      {file.isSuccess ? (
        <>
          <AccountHeader file={file.data} />
          <AccountTabs file={file.data} tab={tab} onTabChange={onTabChange} />
        </>
      ) : null}
    </AdminPage>
  );
};
