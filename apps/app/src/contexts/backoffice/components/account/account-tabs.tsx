import type { AccountFileResponse } from "@passalio/shared";
import { useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backofficeFr } from "../../fr";
import { TrendBadge } from "../usage/trend-badge";
import { AccountJournalPanel } from "./account-journal-panel";
import { PeoplePanel } from "./people-panel";
import { UsagePanel } from "./usage-panel";

export const ACCOUNT_TABS = ["personnel", "utilisation", "journal"] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number];

const isAccountTab = (value: string): value is AccountTab =>
  ACCOUNT_TABS.some((tab) => tab === value);

const LIST_CLASS =
  "grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-[#EAEFF4] p-1 group-data-[orientation=horizontal]/tabs:h-auto lg:flex lg:justify-start lg:gap-6 lg:rounded-none lg:border-b lg:border-[#E3E8EF] lg:bg-transparent lg:p-0";

const TRIGGER_CLASS =
  "h-10 gap-1.5 rounded-[9px] text-sm font-medium text-[#475569] data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-[#0F2A44] group-data-[variant=default]/tabs-list:data-[state=active]:shadow-[0_1px_2px_rgba(15,42,68,0.1)] lg:-mb-px lg:h-auto lg:flex-none lg:rounded-none lg:border-0 lg:border-b-2 lg:border-transparent lg:px-0 lg:py-2.5 lg:text-[13px] lg:text-[#64748B] lg:data-[state=active]:border-b-[#0F2A44] lg:data-[state=active]:bg-transparent lg:group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none";

const COUNT_CLASS = "hidden rounded-full bg-[#EEF3F8] px-2 py-px text-xs text-[#0F2A44] lg:inline";

const text = backofficeFr.account.tabs;

type AccountTabsProps = {
  readonly file: AccountFileResponse;
  readonly tab: AccountTab;
  readonly onTabChange: (tab: AccountTab) => void;
};

export const AccountTabs = ({ file, tab, onTabChange }: AccountTabsProps) => {
  const changeTab = useCallback(
    (value: string) => {
      if (isAccountTab(value)) {
        onTabChange(value);
      }
    },
    [onTabChange],
  );
  const accountId = file.account.id;
  return (
    <Tabs value={tab} onValueChange={changeTab} className="gap-4 lg:gap-5">
      <TabsList aria-label={backofficeFr.account.tabsLabel} className={LIST_CLASS}>
        <TabsTrigger value="personnel" className={TRIGGER_CLASS}>
          {text.people}
          <span className={COUNT_CLASS}>{file.staffCount}</span>
        </TabsTrigger>
        <TabsTrigger value="utilisation" className={TRIGGER_CLASS}>
          {text.usage}
          {file.trend.isDropping ? (
            <TrendBadge trend={file.trend} className="hidden lg:inline-flex" />
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="journal" className={TRIGGER_CLASS}>
          {text.journal}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="personnel">
        <PeoplePanel accountId={accountId} />
      </TabsContent>
      <TabsContent value="utilisation">
        <UsagePanel accountId={accountId} />
      </TabsContent>
      <TabsContent value="journal">
        <AccountJournalPanel accountId={accountId} />
      </TabsContent>
    </Tabs>
  );
};
