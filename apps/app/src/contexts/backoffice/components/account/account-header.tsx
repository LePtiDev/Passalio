import type { AccountFileResponse } from "@passalio/shared";
import { formatShortDateWithYear } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { shortDay } from "../../calendar-labels";
import { backofficeFr } from "../../fr";

const text = backofficeFr.account;

export const accountStatusLabel = ({ account }: AccountFileResponse) =>
  account.isInTrial ? text.trialPill(shortDay(account.trialEndsAt)) : text.endedPill;

export const AccountHeader = ({ file }: { readonly file: AccountFileResponse }) => {
  const { account } = file;
  const details = [
    account.address,
    account.siret === null ? null : text.siret(account.siret),
    text.since(formatShortDateWithYear(new Date(account.createdAt))),
  ].filter((detail) => detail !== null && detail !== "");
  return (
    <div className="hidden flex-col gap-1 lg:flex">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-xl font-bold tracking-[-0.015em]">{account.name}</h1>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            account.isInTrial ? "bg-[#EEF3F8] text-[#334155]" : "bg-[#FEF3E2] text-[#B45309]",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              account.isInTrial ? "bg-[#94A3B8]" : "bg-[#B45309]",
            )}
          />
          {accountStatusLabel(file)}
        </span>
      </div>
      <p className="text-[13px] text-[#475569]">{details.join(" · ")}</p>
    </div>
  );
};
