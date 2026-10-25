import type { SignUpSettingsResponse } from "@passalio/shared";
import { Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { settingsFr } from "../../settings-fr";
import { ADMIN_CARD_CLASS } from "../admin-styles";

const text = settingsFr.signUp;

const SWITCH_ID = "sign-up-switch";

const changeLine = ({ isSignUpOpen, changedAt, changedByName }: SignUpSettingsResponse) =>
  changedAt === null ? text.neverChanged : text.changedBy(isSignUpOpen, changedByName, changedAt);

const RuleList = ({
  title,
  items,
  summary,
  isAllowed,
}: {
  readonly title: string;
  readonly items: readonly string[];
  readonly summary: string;
  readonly isAllowed: boolean;
}) => {
  const Icon = isAllowed ? Check : X;
  return (
    <div className="flex flex-col gap-1.5 text-[14px] text-[#334155] lg:text-[13px]">
      <span className="text-[13px] font-semibold text-[#64748B] lg:text-xs">{title}</span>
      <span className="lg:hidden">{summary}</span>
      <ul className="hidden flex-col gap-1.5 lg:flex">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                isAllowed ? "text-[#0E7C5A]" : "text-[#B42318]",
              )}
              strokeWidth={2.2}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

type SignUpSettingsCardProps = {
  readonly settings: SignUpSettingsResponse;
  readonly host: string;
  readonly isChanging: boolean;
  readonly onToggle: (isSignUpOpen: boolean) => void;
};

export const SignUpSettingsCard = ({
  settings,
  host,
  isChanging,
  onToggle,
}: SignUpSettingsCardProps) => {
  const isOpen = settings.isSignUpOpen;
  return (
    <section aria-labelledby="sign-up-title" className={ADMIN_CARD_CLASS}>
      <div className="flex items-baseline justify-between gap-3 border-b border-[#E3E8EF] px-4 py-3">
        <h2 id="sign-up-title" className="text-[15px] font-bold">
          {text.title}
        </h2>
        <span className="hidden text-xs text-[#64748B] lg:inline">{`${host}/inscription`}</span>
      </div>
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={SWITCH_ID}
              className="-my-3 inline-flex min-h-12 items-center text-[15px] font-semibold lg:my-0 lg:min-h-0 lg:text-sm"
            >
              {text.switchLabel}
            </label>
            <span
              className={cn(
                "hidden rounded-md px-2 py-0.5 text-xs font-semibold lg:inline-flex",
                isOpen ? "bg-[#E6F4EE] text-[#0B5B43]" : "bg-[#FDECEC] text-[#B42318]",
              )}
            >
              {isOpen ? text.open : text.closed}
            </span>
          </span>
          <span className="text-[14px] leading-[1.45] text-[#475569] lg:text-[13px]">
            {isOpen ? text.openDescription : text.closedDescription}
          </span>
          <span className="hidden text-xs text-[#64748B] lg:inline">{changeLine(settings)}</span>
        </div>
        <span className="-m-3 flex size-12 shrink-0 items-center justify-center">
          <Switch
            id={SWITCH_ID}
            checked={isOpen}
            disabled={isChanging}
            onCheckedChange={onToggle}
            className="h-[26px] w-11 data-[state=checked]:bg-[#0E7C5A] data-[state=unchecked]:bg-[#CBD5E1] lg:h-[22px] lg:w-10 [&>span]:size-[22px] lg:[&>span]:size-[18px]"
          />
        </span>
      </div>
      <div className="grid gap-4 border-t border-[#EEF2F6] p-4 lg:grid-cols-2">
        <RuleList
          title={text.allowedTitle}
          items={text.allowed}
          summary={text.allowedShort}
          isAllowed
        />
        <RuleList
          title={text.blockedTitle}
          items={text.blocked}
          summary={text.blockedShort}
          isAllowed={false}
        />
      </div>
    </section>
  );
};
