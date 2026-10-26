import type { MailSettingsResponse } from "@passalio/shared";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { configurationFr } from "../../fr-configuration";

const text = configurationFr.status;

type MailboxState = "connected" | "untested" | "none";

const stateOf = (settings: MailSettingsResponse["settings"]): MailboxState => {
  if (settings === null) {
    return "none";
  }
  return settings.verifiedAt === null ? "untested" : "connected";
};

const lineOf = (settings: MailSettingsResponse["settings"]) => {
  if (settings === null) {
    return text.noneLine;
  }
  if (settings.verifiedAt === null) {
    return text.untestedLine;
  }
  return text.line(settings.senderAddress, configurationFr.providers[settings.provider]);
};

const STATE_STYLES: Readonly<Record<MailboxState, { card: string; dot: string }>> = {
  connected: { card: "border-[#C9E6D9] bg-[#F3FAF7]", dot: "bg-[#0E7C5A]" },
  untested: { card: "border-[#FCE3BD] bg-[#FFFAF2]", dot: "bg-[#B45309]" },
  none: { card: "border-[#E3E8EF] bg-white", dot: "bg-[#94A3B8]" },
};

export const MailboxStatus = ({
  settings,
}: {
  readonly settings: MailSettingsResponse["settings"];
}) => {
  const state = stateOf(settings);
  const styles = STATE_STYLES[state];
  const line = lineOf(settings);
  return (
    <section
      aria-label={text[state]}
      className={cn(
        "flex flex-col gap-1.5 rounded-[14px] border p-3.5 lg:rounded-xl lg:px-[18px] lg:py-4",
        styles.card,
      )}
    >
      <span className="flex items-center gap-2 text-base font-bold lg:text-[15px]">
        <span aria-hidden="true" className={cn("size-2 rounded-full", styles.dot)} />
        {text[state]}
      </span>
      <span className="text-sm text-[#475569] lg:text-[13px]">{line}</span>
    </section>
  );
};

export const OtherMemberNotice = ({ name }: { readonly name: string }) => (
  <div className="flex items-start gap-2.5 rounded-[10px] border border-[#FCE3BD] bg-[#FFFAF2] px-4 py-3 text-sm leading-normal lg:text-[13px]">
    <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#B45309]" />
    <span>
      <strong>{configurationFr.otherMember.title(name)}</strong>{" "}
      {configurationFr.otherMember.text(name)}
    </span>
  </div>
);
