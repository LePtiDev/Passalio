import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { identityFr } from "../fr";
import { AUTH_SECONDARY_BUTTON_CLASS } from "./auth-styles";

const RESEND_DELAY_SECONDS = 60;

const MAILBOXES = [
  { label: identityFr.signIn.openGmail, href: "https://mail.google.com" },
  { label: identityFr.signIn.openOutlook, href: "https://outlook.live.com" },
] as const;

type MagicLinkSentProps = {
  readonly email: string;
  readonly onResend: () => Promise<void>;
  readonly onUseOtherEmail: () => void;
};

const formatCountdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export const MagicLinkSent = ({ email, onResend, onUseOtherEmail }: MagicLinkSentProps) => {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS);

  useEffect(() => {
    if (secondsLeft === 0) {
      return undefined;
    }
    const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const resend = useCallback(async () => {
    await onResend();
    setSecondsLeft(RESEND_DELAY_SECONDS);
  }, [onResend]);

  const text = identityFr.signIn;
  return (
    <div className="flex flex-col gap-5" aria-live="polite">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] leading-tight font-bold tracking-tight">
          {text.checkInboxTitle}
        </h1>
        <p className="text-[15px] leading-normal text-muted-foreground lg:text-sm">
          {text.checkInboxIntro}{" "}
          <strong className="font-semibold break-words text-foreground">{email}</strong>
        </p>
        <p className="text-[15px] leading-normal text-muted-foreground lg:text-sm">
          {text.checkInboxValidity}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {MAILBOXES.map((mailbox) => (
          <Button
            key={mailbox.href}
            asChild
            variant="outline"
            className={AUTH_SECONDARY_BUTTON_CLASS}
          >
            <a href={mailbox.href} target="_blank" rel="noreferrer">
              {mailbox.label}
            </a>
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        className={AUTH_SECONDARY_BUTTON_CLASS}
        disabled={secondsLeft > 0}
        onClick={resend}
      >
        {secondsLeft > 0 ? text.resendIn(formatCountdown(secondsLeft)) : text.resend}
      </Button>
      <Button variant="ghost" className={AUTH_SECONDARY_BUTTON_CLASS} onClick={onUseOtherEmail}>
        {text.otherEmail}
      </Button>
    </div>
  );
};
