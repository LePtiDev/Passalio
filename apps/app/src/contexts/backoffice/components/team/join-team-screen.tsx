import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/error-state";
import { AuthLayout } from "@/contexts/identity";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorOf, unwrap } from "@/lib/api-client";
import { ADMIN_PATH } from "@/lib/session";
import { useSignOutButton } from "@/lib/use-sign-out-button";
import { teamApi } from "../../team-api";
import { PLATFORM_ROLE_LABELS, teamFr } from "../../team-fr";

const text = teamFr.join;

const PRIMARY_CLASS =
  "h-12 rounded-[10px] text-base font-semibold shadow-[0_1px_2px_rgba(15,42,68,0.2)] lg:h-11 lg:rounded-lg lg:text-sm";

const LINK_CLASS =
  "min-h-12 self-start text-sm text-[#475569] hover:text-[#0F2A44] lg:min-h-0 lg:text-[13px]";

const INVALID_CODES: ReadonlySet<string> = new Set(["invitation_not_found", "invitation_expired"]);

const NO_RETRY = false;

const WELCOME_SHOWCASE = { badge: text.showcaseBadge, title: text.showcaseTitle };

const INVALID_SHOWCASE = { badge: text.showcaseBadge, title: text.invalidShowcaseTitle };

const JoinLayout = ({
  children,
  isInvalid = false,
}: {
  readonly children: ReactNode;
  readonly isInvalid?: boolean;
}) => (
  <AuthLayout showcase={isInvalid ? INVALID_SHOWCASE : WELCOME_SHOWCASE} hasMobileBand={false}>
    {children}
  </AuthLayout>
);

const Heading = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <h1 className="text-[22px] leading-tight font-bold tracking-[-0.015em]">{title}</h1>
    <p className="text-[15px] leading-normal text-[#475569] lg:text-sm">{children}</p>
  </div>
);

const JoinSkeleton = () => (
  <div className="flex flex-col gap-5" aria-busy="true">
    <Skeleton className="h-7 w-64" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full rounded-[10px]" />
    <Skeleton className="h-12 w-full rounded-[10px] lg:h-11" />
  </div>
);

type JoinTeamScreenProps = {
  readonly invitationId: string;
  readonly currentEmail: string;
  readonly returnTo: string;
};

export const JoinTeamScreen = ({ invitationId, currentEmail, returnTo }: JoinTeamScreenProps) => {
  const navigate = useNavigate();
  const { signOut: switchAccount, isSigningOut } = useSignOutButton(returnTo);
  const goHome = useCallback(() => void navigate({ to: "/" }), [navigate]);
  const invitation = useQuery({
    queryKey: ["team-invitation", invitationId],
    queryFn: async () => unwrap(await teamApi.fetchInvitation(invitationId)),
    retry: NO_RETRY,
  });
  const accept = useMutation({
    mutationFn: async () => unwrap(await teamApi.acceptInvitation(invitationId)),
    onSuccess: async () => {
      toast.success(text.joined);
      await navigate({ to: ADMIN_PATH });
    },
  });
  const { refetch } = invitation;
  const retry = useCallback(() => void refetch(), [refetch]);
  const { mutate } = accept;
  const join = useCallback(() => mutate(), [mutate]);

  if (invitation.isPending) {
    return (
      <JoinLayout>
        <JoinSkeleton />
      </JoinLayout>
    );
  }
  if (invitation.isError) {
    if (!INVALID_CODES.has(apiErrorOf(invitation.error).code)) {
      return (
        <JoinLayout>
          <ErrorState error={invitation.error} onRetry={retry} />
        </JoinLayout>
      );
    }
    return (
      <JoinLayout isInvalid>
        <div className="flex flex-col gap-5">
          <Heading title={text.invalidTitle}>{text.invalidText}</Heading>
          <Button className={PRIMARY_CLASS} onClick={goHome}>
            {text.home}
          </Button>
        </div>
      </JoinLayout>
    );
  }
  const { role, email, inviterName } = invitation.data.invitation;
  if (email.toLocaleLowerCase() !== currentEmail.toLocaleLowerCase()) {
    return (
      <JoinLayout isInvalid>
        <div className="flex flex-col gap-5">
          <Heading title={text.mismatchTitle}>{text.mismatchText(email, currentEmail)}</Heading>
          <Button className={PRIMARY_CLASS} onClick={switchAccount} disabled={isSigningOut}>
            {text.switchTo}
          </Button>
        </div>
      </JoinLayout>
    );
  }
  return (
    <JoinLayout>
      <div className="flex flex-col gap-5">
        <Heading title={text.title}>
          {text.text(inviterName)}{" "}
          <strong className="text-[#0F2A44]">{PLATFORM_ROLE_LABELS[role]}</strong>.{" "}
          {text.signedInAs(currentEmail)}
        </Heading>
        <div className="flex flex-col gap-1.5 rounded-[10px] border border-[#E3E8EF] bg-[#F7F9FB] px-3.5 py-3">
          <strong className="text-[15px] lg:text-sm">{text.nextTitle}</strong>
          <span className="text-[15px] leading-normal text-[#475569] lg:text-sm">
            {text.nextText}
          </span>
        </div>
        <Button className={PRIMARY_CLASS} disabled={accept.isPending} onClick={join}>
          {accept.isPending ? text.joining : text.submit}
        </Button>
        <button
          type="button"
          className={LINK_CLASS}
          onClick={switchAccount}
          disabled={isSigningOut}
        >
          {text.switchAccount}
        </button>
      </div>
    </JoinLayout>
  );
};
