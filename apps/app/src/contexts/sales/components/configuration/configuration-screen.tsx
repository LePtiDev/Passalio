import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  AdminHeading,
  AdminPage,
  canManageTeam,
  useNow,
  type AdminTrailStep,
  type PlatformAdmin,
} from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { configurationFr } from "../../fr-configuration";
import { useIsSavingMailSettings, useMailSettings } from "../../hooks/use-mail-settings";
import { MailboxStatus, OtherMemberNotice } from "./configuration-aside";
import { CONFIGURATION_FORM_ID, ConfigurationForm } from "./configuration-form";
import { CONFIGURATION_TABS, type ConfigurationTab } from "./configuration-form-schema";
import { ConfigurationSkeleton, MailboxStatusSkeleton } from "./configuration-skeleton";
import { MemberSelect } from "./member-select";

const text = configurationFr;

const TRAIL: readonly AdminTrailStep[] = [{ label: text.title }];

const MOBILE_BACK = { to: "/admin/journee", label: text.backToDay } as const;

const RubricLink = ({
  rubric,
  isCurrent,
  memberId,
}: {
  readonly rubric: ConfigurationTab;
  readonly isCurrent: boolean;
  readonly memberId: string | undefined;
}) => {
  const search = useMemo(() => ({ membre: memberId, rubrique: rubric }), [memberId, rubric]);
  return (
    <Link
      to="/admin/configuration"
      search={search}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "flex h-12 items-center rounded-[10px] border px-4 text-[15px] whitespace-nowrap lg:h-8 lg:rounded-md lg:border-0 lg:px-2.5 lg:text-[13px]",
        isCurrent
          ? "border-[#0F2A44] bg-[#EEF3F8] font-semibold text-[#0F2A44]"
          : "border-[#E3E8EF] text-[#334155] hover:bg-[#F7F9FB]",
      )}
    >
      {text.tabs[rubric]}
    </Link>
  );
};

const RubricLinks = ({
  tab,
  memberId,
}: {
  readonly tab: ConfigurationTab;
  readonly memberId: string | undefined;
}) => (
  <nav aria-label={text.rubrics} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
    <ul className="flex gap-2 lg:flex-col lg:gap-0.5">
      {CONFIGURATION_TABS.map((rubric) => (
        <li key={rubric} className="shrink-0">
          <RubricLink rubric={rubric} isCurrent={rubric === tab} memberId={memberId} />
        </li>
      ))}
    </ul>
  </nav>
);

type ConfigurationScreenProps = {
  readonly admin: PlatformAdmin;
  readonly memberId: string | undefined;
  readonly tab: ConfigurationTab;
};

export const ConfigurationScreen = ({ admin, memberId, tab }: ConfigurationScreenProps) => {
  const now = useNow();
  const navigate = useNavigate();
  const canManage = canManageTeam(admin.role);
  const userId = canManage && memberId !== undefined ? memberId : admin.userId;
  const isSelf = userId === admin.userId;
  const linkedMember = isSelf ? undefined : userId;
  const settings = useMailSettings(userId);
  const isSaving = useIsSavingMailSettings(userId);
  const { refetch } = settings;
  const retry = useCallback(() => void refetch(), [refetch]);
  const changeTab = useCallback(
    (rubric: ConfigurationTab) =>
      void navigate({
        to: "/admin/configuration",
        search: { membre: linkedMember, rubrique: rubric },
      }),
    [navigate, linkedMember],
  );
  const changeMember = useCallback(
    (member: string) =>
      void navigate({
        to: "/admin/configuration",
        search: { membre: member === admin.userId ? undefined : member, rubrique: tab },
      }),
    [navigate, admin.userId, tab],
  );
  const memberName = settings.data?.member.name ?? (isSelf ? admin.name : "");
  const memberSelectOf = (id: string) =>
    canManage ? (
      <MemberSelect id={id} selfId={admin.userId} value={userId} onChange={changeMember} />
    ) : null;
  return (
    <AdminPage
      section="commercial"
      trail={TRAIL}
      mobileTitle={text.title}
      mobileSubtitle={text.mobileSubtitle(text.tabs[tab], memberName)}
      mobileBack={MOBILE_BACK}
    >
      <AdminHeading
        title={text.title}
        subtitle={isSelf ? text.subtitle(admin.name, admin.role) : memberName}
      >
        <span className="flex items-center gap-3">
          {memberSelectOf("configuration-member")}
          <Button
            type="submit"
            form={CONFIGURATION_FORM_ID}
            disabled={!settings.isSuccess || isSaving}
          >
            {isSaving ? text.saving : text.save}
          </Button>
        </span>
      </AdminHeading>
      {canManage ? (
        <div className="lg:hidden">{memberSelectOf("configuration-member-mobile")}</div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_minmax(0,1fr)_300px] lg:items-start lg:gap-6">
        <RubricLinks tab={tab} memberId={linkedMember} />
        <aside className="flex flex-col gap-4 lg:order-3">
          {settings.isPending ? <MailboxStatusSkeleton /> : null}
          {settings.isSuccess ? <MailboxStatus settings={settings.data.settings} /> : null}
        </aside>
        <div className="flex min-w-0 flex-col gap-5 lg:order-2">
          {isSelf || memberName === "" ? null : <OtherMemberNotice name={memberName} />}
          {settings.isPending ? <ConfigurationSkeleton /> : null}
          {settings.isError ? (
            <ErrorState error={settings.error} message={text.loadFailed} onRetry={retry} />
          ) : null}
          {settings.isSuccess ? (
            <ConfigurationForm
              key={userId}
              response={settings.data}
              role={isSelf ? admin.role : null}
              tab={tab}
              now={now}
              onTabChange={changeTab}
            />
          ) : null}
        </div>
      </div>
    </AdminPage>
  );
};
