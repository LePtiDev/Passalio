import type { AccountSummaryResponse } from "@passalio/shared";
import { AccountLink } from "../account-link";
import { shortDay } from "../../calendar-labels";
import { backofficeFr } from "../../fr";
import { ADMIN_CARD_CLASS, ADMIN_CARD_HEADER_CLASS, ADMIN_CARD_TITLE_CLASS } from "../admin-styles";

const text = backofficeFr.overview;

export const TrialsCard = ({
  accounts,
}: {
  readonly accounts: readonly AccountSummaryResponse[];
}) => (
  <section className={ADMIN_CARD_CLASS} aria-labelledby="trials-title">
    <div className={ADMIN_CARD_HEADER_CLASS}>
      <h2 id="trials-title" className={ADMIN_CARD_TITLE_CLASS}>
        {text.trialsTitle}
      </h2>
      <span className="text-[13px] text-[#64748B]">{text.trialsSubtitle}</span>
    </div>
    {accounts.length === 0 ? (
      <p className="px-4 py-6 text-[13px] text-[#64748B]">{text.trialsEmpty}</p>
    ) : (
      <ul>
        {accounts.map((account) => (
          <li key={account.id} className="border-b border-[#EEF2F6] last:border-b-0">
            <AccountLink
              accountId={account.id}
              className="flex min-h-14 items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#F7F9FB]"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-semibold lg:text-[13px]">
                  {account.name}
                </span>
                <span className="truncate text-[13px] text-[#64748B] lg:text-xs">
                  {text.trialLine(account.staffCount, account.trend.recent)}
                </span>
              </span>
              <span className="shrink-0 text-[15px] font-medium tabular-nums lg:text-[13px]">
                {text.endsOn(shortDay(account.trialEndsAt))}
              </span>
            </AccountLink>
          </li>
        ))}
      </ul>
    )}
  </section>
);
