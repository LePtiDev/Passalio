import { FormSkeleton } from "@/components/page-skeleton";
import { useSignUpAvailability } from "../hooks/use-sign-up-availability";
import { AuthLayout } from "./auth-layout";
import { SignUpClosed } from "./sign-up-closed";
import { SignUpForm } from "./sign-up-form";

const INVITATION_PATHS = ["/invitations/", "/equipe-passalio/invitations/"];

export const isInvitationReturn = (returnTo: string | undefined) =>
  returnTo !== undefined && INVITATION_PATHS.some((path) => returnTo.startsWith(path));

const ClosedSignUp = ({ returnTo }: { readonly returnTo: string | undefined }) => {
  const availability = useSignUpAvailability();
  if (availability.isPending) {
    return (
      <AuthLayout showcase="sign-up">
        <FormSkeleton />
      </AuthLayout>
    );
  }
  if (availability.data?.isSignUpOpen === false) {
    return (
      <AuthLayout showcase="sign-up-closed">
        <SignUpClosed returnTo={returnTo} />
      </AuthLayout>
    );
  }
  return (
    <AuthLayout showcase="sign-up">
      <SignUpForm returnTo={returnTo ?? "/"} />
    </AuthLayout>
  );
};

export const SignUpScreen = ({ returnTo }: { readonly returnTo: string | undefined }) =>
  isInvitationReturn(returnTo) ? (
    <AuthLayout showcase="sign-up">
      <SignUpForm returnTo={returnTo ?? "/"} />
    </AuthLayout>
  ) : (
    <ClosedSignUp returnTo={returnTo} />
  );
