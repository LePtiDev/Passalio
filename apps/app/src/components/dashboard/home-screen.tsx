import { Link } from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import { useCallback } from "react";
import { DesktopTopBar, MobileTopBar, PageContent } from "@/components/app-shell/page-bars";
import { ErrorState } from "@/components/error-state";
import { InitialsAvatar } from "@/components/initials-avatar";
import {
  OrganizationBadge,
  useOrganization,
  usePendingInvitations,
  useTeam,
} from "@/contexts/identity";
import { fr } from "@/fr";
import { GettingStartedCard } from "./getting-started-card";
import { gettingStartedTasks } from "./getting-started-tasks";
import { HomeSkeleton } from "./home-skeleton";

const TRAIL = [{ label: fr.shell.dashboard }] as const;

type HomeScreenProps = {
  readonly userName: string;
  readonly isWelcome: boolean;
};

const WelcomeBanner = ({ pendingCount }: { readonly pendingCount: number }) => (
  <output className="flex items-center gap-2.5 rounded-lg border border-[#BFE3D2] bg-[#E6F4EE] px-3.5 py-2.5 text-sm text-[#0B5B43] lg:text-[13px]">
    <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
    {pendingCount > 0 ? fr.home.readyWithInvitations(pendingCount) : fr.home.ready}
  </output>
);

const TrialCard = () => (
  <section className="flex min-w-0 flex-[1_1_280px] flex-col gap-2 self-start rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-[10px]">
    <strong className="text-sm lg:text-[13px]">{fr.home.trialTitle}</strong>
    <span className="text-sm text-[#475569] lg:text-xs">{fr.home.trialText}</span>
  </section>
);

const HomeContent = ({ isWelcome }: { readonly isWelcome: boolean }) => {
  const organization = useOrganization();
  const team = useTeam();
  const pending = usePendingInvitations();
  const { refetch: refetchOrganization } = organization;
  const { refetch: refetchTeam } = team;
  const { refetch: refetchPending } = pending;
  const retry = useCallback(() => {
    void refetchOrganization();
    void refetchTeam();
    void refetchPending();
  }, [refetchOrganization, refetchTeam, refetchPending]);

  const failure = organization.error ?? team.error ?? pending.error;
  if (failure !== null) {
    return <ErrorState error={failure} onRetry={retry} />;
  }
  if (organization.data === undefined || team.data === undefined || pending.data === undefined) {
    return <HomeSkeleton />;
  }

  const membersCount = team.data.pages.reduce((total, page) => total + page.members.length, 0);
  const pendingCount = pending.data.pages.reduce(
    (total, page) => total + page.invitations.length,
    0,
  );
  const tasks = gettingStartedTasks({
    isCompanyReady: organization.data.isOnboardingCompleted,
    invitedOrJoinedCount: membersCount - 1 + pendingCount,
  });

  return (
    <>
      {isWelcome ? <WelcomeBanner pendingCount={pendingCount} /> : null}
      <div className="flex flex-wrap items-start gap-4">
        <GettingStartedCard tasks={tasks} />
        <TrialCard />
      </div>
    </>
  );
};

export const HomeScreen = ({ userName, isWelcome }: HomeScreenProps) => {
  const firstName = userName.split(/\s+/)[0] ?? "";
  return (
    <>
      <DesktopTopBar trail={TRAIL} />
      <MobileTopBar>
        <span className="min-w-0 flex-1">
          <OrganizationBadge placement="header" />
        </span>
        <Link
          to="/reglages"
          aria-label={fr.shell.settings}
          className="flex size-12 items-center justify-center"
        >
          <InitialsAvatar name={userName} tone="mint" size="medium" />
        </Link>
      </MobileTopBar>
      <PageContent>
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-bold tracking-[-0.015em] lg:text-xl">
            {fr.home.greeting(firstName)}
          </h1>
          <p className="text-[15px] text-[#475569] lg:text-[13px]">{fr.home.subtitle}</p>
        </div>
        <HomeContent isWelcome={isWelcome} />
      </PageContent>
    </>
  );
};
