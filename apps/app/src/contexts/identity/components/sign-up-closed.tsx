import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SIGN_IN_PATH } from "@/lib/session";
import { identityFr } from "../fr";

const text = identityFr.signUpClosed;

const LANDING_URL = "https://passalio.com";

export const SignUpClosed = ({ returnTo }: { readonly returnTo: string | undefined }) => {
  const signInSearch = useMemo(
    () => (returnTo === undefined ? {} : { retour: returnTo }),
    [returnTo],
  );
  return (
    <div className="flex flex-col gap-5">
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-xl bg-[#EEF3F8] text-[#0F2A44]"
      >
        <Lock className="size-[22px]" strokeWidth={1.8} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] leading-tight font-bold tracking-tight">{text.title}</h1>
        <p className="text-[15px] leading-normal text-muted-foreground lg:text-sm">{text.text}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <Button asChild>
          <Link to={SIGN_IN_PATH} search={signInSearch}>
            {text.signIn}
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <a href={LANDING_URL}>{text.discover}</a>
        </Button>
      </div>
    </div>
  );
};
