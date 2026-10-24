import type { AccountSummaryResponse } from "@passalio/shared";
import { ChevronRight } from "lucide-react";
import { InitialsAvatar, type AvatarTone } from "@/components/initials-avatar";
import { cn } from "@/lib/utils";
import { lastSeenLabel } from "../../calendar-labels";
import { backofficeFr } from "../../fr";
import { AccountLink } from "../account-link";
import { Sparkline } from "../usage/sparkline";
import { TrendBadge } from "../usage/trend-badge";
import { TrialStatus } from "../usage/trial-status";

export const ACCOUNT_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_150px_170px_170px_140px_16px] lg:gap-4";

const STAFF_TONES: readonly AvatarTone[] = ["mint", "slate", "amber"];

const MAX_AVATARS = 3;

const StaffAvatars = ({ account }: { readonly account: AccountSummaryResponse }) => (
  <span aria-hidden="true" className="hidden items-center gap-2 lg:flex">
    <span className="flex">
      {account.staff.slice(0, MAX_AVATARS).map((person, index) => (
        <span
          key={person.id}
          className={cn("rounded-full ring-2 ring-white", index > 0 && "-ml-1.5")}
        >
          <InitialsAvatar
            name={person.name}
            tone={STAFF_TONES[index % STAFF_TONES.length] ?? "slate"}
            size="small"
          />
        </span>
      ))}
    </span>
    <span className="text-[13px] whitespace-nowrap text-[#475569]">
      {backofficeFr.usage.staff(account.staffCount)}
    </span>
  </span>
);

export const AccountRow = ({
  account,
  now,
}: {
  readonly account: AccountSummaryResponse;
  readonly now: Date;
}) => {
  return (
    <li className="border-b border-[#EEF2F6] last:border-b-0">
      <AccountLink
        accountId={account.id}
        className={cn(
          ACCOUNT_GRID_CLASS,
          "min-h-[72px] px-4 py-2.5 hover:bg-[#F7F9FB] lg:min-h-[52px]",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="hidden lg:flex">
            <InitialsAvatar name={account.name} tone="amber" size="small" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="line-clamp-2 text-[15px] font-semibold lg:truncate lg:text-[13px]">
              <span className="sr-only">{`${backofficeFr.accounts.openPrefix} `}</span>
              {account.name}
            </span>
            <span aria-hidden="true" className="truncate text-[13px] text-[#64748B] lg:text-xs">
              <span className="lg:hidden">
                {account.isInTrial ? backofficeFr.status.trial : backofficeFr.status.trialEnded} ·{" "}
                {backofficeFr.usage.staff(account.staffCount)}
              </span>
              <span className="hidden lg:inline">{account.address ?? ""}</span>
            </span>
          </span>
        </span>
        <span aria-hidden="true" className="hidden lg:block">
          <TrialStatus isInTrial={account.isInTrial} trialEndsAt={account.trialEndsAt} />
        </span>
        <StaffAvatars account={account} />
        <span aria-hidden="true" className="flex items-center justify-end gap-3 lg:justify-start">
          <Sparkline months={account.monthlyActivity} isDown={account.trend.isDropping} />
          <TrendBadge trend={account.trend} className="min-w-14 text-right lg:text-left" />
        </span>
        <span aria-hidden="true" className="hidden min-w-0 flex-col lg:flex">
          <span className="text-[13px]">{lastSeenLabel(account.lastActive?.day ?? null, now)}</span>
          <span className="truncate text-xs text-[#64748B]">{account.lastActive?.name ?? ""}</span>
        </span>
        <ChevronRight aria-hidden="true" className="hidden size-4 text-[#94A3B8] lg:block" />
      </AccountLink>
    </li>
  );
};
