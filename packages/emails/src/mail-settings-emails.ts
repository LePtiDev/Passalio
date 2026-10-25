import type { RenderedEmail } from "./email-content";
import { renderEmail } from "./email-layout";
import { fr } from "./fr";

export type MailSettingsField = keyof typeof fr.mailSettingsChanged.fields;

export type MailSettingsChangedEmailInput = {
  readonly editorName: string;
  readonly fields: readonly MailSettingsField[];
  readonly at: Date;
  readonly url: string;
};

export type MailboxTestEmailInput = {
  readonly at: Date;
  readonly url: string;
};

const PARIS_MOMENT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export const parisMoment = (at: Date) => PARIS_MOMENT.format(at);

export const mailSettingsChangedEmail = (
  { editorName, fields, at, url }: MailSettingsChangedEmailInput,
  assetsUrl: string,
): RenderedEmail => {
  const text = fr.mailSettingsChanged;
  return renderEmail(
    {
      subject: text.subject(editorName),
      hero: { kind: "icon", icon: "key" },
      title: text.title,
      lead: text.lead(editorName, fields.map((field) => text.fields[field]).join(", ")),
      action: { label: text.action, url },
      validity: text.when(parisMoment(at)),
      safety: text.safety(editorName),
    },
    assetsUrl,
  );
};

export const mailboxTestEmail = ({ at, url }: MailboxTestEmailInput, assetsUrl: string) => {
  const text = fr.mailboxTest;
  return renderEmail(
    {
      subject: text.subject,
      hero: { kind: "icon", icon: "key" },
      title: text.title,
      lead: text.lead,
      action: { label: text.action, url },
      validity: text.when(parisMoment(at)),
      safety: text.safety,
    },
    assetsUrl,
  );
};
