import type { AccountSummaryResponse } from "@passalio/shared";
import { InitialsAvatar } from "@/components/initials-avatar";
import { backofficeFr } from "../../fr";
import { AccountLink } from "../account-link";
import { AccountsFilterLink } from "../accounts-filter-link";
import {
  ADMIN_CARD_CLASS,
  ADMIN_CARD_HEADER_CLASS,
  ADMIN_CARD_TITLE_CLASS,
  ADMIN_LINK_CLASS,
  ADMIN_TABLE_HEADER_CLASS,
} from "../admin-styles";
import { Sparkline } from "../usage/sparkline";
import { TrendBadge } from "../usage/trend-badge";
import { TrialStatus } from "../usage/trial-status";

const text = backofficeFr.overview;

const GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 lg:grid-cols-[minmax(0,1fr)_120px_72px_88px_72px] lg:gap-4";

const DropRow = ({ account }: { readonly account: AccountSummaryResponse }) => (
  <li className="border-b border-[#EEF2F6] last:border-b-0">
    <AccountLink
      accountId={account.id}
      className={`${GRID_CLASS} min-h-16 px-4 py-2.5 hover:bg-[#F7F9FB]`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="hidden lg:flex">
          <InitialsAvatar name={account.name} tone="amber" size="small" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="line-clamp-2 text-[15px] font-semibold lg:truncate lg:text-[13px]">
            {account.name}
          </span>
          <span className="truncate text-[13px] text-[#64748B] lg:text-xs">
            {backofficeFr.usage.staff(account.staffCount)}
          </span>
        </span>
      </span>
      <span className="hidden lg:block">
        <TrialStatus isInTrial={account.isInTrial} trialEndsAt={account.trialEndsAt} />
      </span>
      <Sparkline months={account.monthlyActivity} isDown />
      <span
        className="hidden text-right text-[13px] tabular-nums lg:block"
        aria-label={text.connectionsLabel(account.trend.recent, account.trend.previous)}
      >
        <strong>{account.trend.recent}</strong>
        <span className="text-[#94A3B8]"> / {account.trend.previous}</span>
      </span>
      <span className="flex justify-end">
        <TrendBadge trend={account.trend} />
      </span>
    </AccountLink>
  </li>
);

export const DroppingCard = ({
  accounts,
}: {
  readonly accounts: readonly AccountSummaryResponse[];
}) => (
  <section className={ADMIN_CARD_CLASS} aria-labelledby="dropping-title">
    <div className={ADMIN_CARD_HEADER_CLASS}>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2.5">
        <h2 id="dropping-title" className={ADMIN_CARD_TITLE_CLASS}>
          {text.droppingTitle}
        </h2>
        <span className="hidden text-[13px] text-[#64748B] lg:inline">{text.droppingSubtitle}</span>
      </span>
      <AccountsFilterLink filter="dropping" className={ADMIN_LINK_CLASS}>
        {text.seeAll}
      </AccountsFilterLink>
    </div>
    {accounts.length === 0 ? (
      <p className="px-4 py-6 text-[13px] text-[#64748B]">{text.droppingEmpty}</p>
    ) : (
      <>
        <div aria-hidden="true" className={`${GRID_CLASS} ${ADMIN_TABLE_HEADER_CLASS}`}>
          <span>{backofficeFr.accounts.columns.company}</span>
          <span>{backofficeFr.accounts.columns.subscription}</span>
          <span>{text.droppingColumns.history}</span>
          <span className="text-right">{text.droppingColumns.connections}</span>
          <span className="text-right">{text.droppingColumns.change}</span>
        </div>
        <ul>
          {accounts.map((account) => (
            <DropRow key={account.id} account={account} />
          ))}
        </ul>
      </>
    )}
  </section>
);
