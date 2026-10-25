import type { RenderedEmail } from "./email-content";
import { COLORS, escapeHtml, FONT_STACK } from "./email-layout";
import { fr } from "./fr";

const text = fr.prospectReminder;

export type ReminderNotify = keyof typeof text.eyebrows;

export type ReminderTaskKind = keyof typeof text.tasks;

export type ProspectReminderEmailInput = {
  readonly kind: ReminderTaskKind;
  readonly notify: ReminderNotify;
  readonly dueAt: Date;
  readonly companyName: string;
  readonly companyCity: string | null;
  readonly contactName: string | null;
  readonly phone: string | null;
  readonly lastNote: { readonly text: string; readonly at: Date } | null;
  readonly interest: keyof typeof text.interest | null;
  readonly teamSize: keyof typeof text.teamSizes | null;
  readonly toolKind: keyof typeof text.toolKinds | null;
  readonly companyUrl: string;
};

const PARIS_TIME = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

const PARIS_DAY = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
});

export const parisClockTime = (at: Date) => {
  const parts = PARIS_TIME.formatToParts(at);
  const part = (type: "hour" | "minute") => parts.find((entry) => entry.type === type)?.value;
  return `${Number(part("hour"))} h ${part("minute")}`;
};

const presentOnly = (values: readonly (string | null)[]) =>
  values.filter((value): value is string => value !== null && value !== "");

const telUrl = (phone: string) => `tel:${phone.replaceAll(/[^\d+]/g, "")}`;

const linesOf = (input: ProspectReminderEmailInput) => {
  const task = text.tasks[input.kind](
    input.contactName ?? input.companyName,
    parisClockTime(input.dueAt),
  );
  const company = presentOnly([
    presentOnly([input.companyName, input.companyCity]).join(", "),
    input.phone,
  ]).join(" · ");
  const note =
    input.lastNote === null
      ? null
      : text.note(PARIS_DAY.format(input.lastNote.at), input.lastNote.text);
  const qualification = presentOnly([
    input.interest === null ? null : text.interest[input.interest],
    input.teamSize === null ? null : text.teamSizes[input.teamSize],
    input.toolKind === null ? null : text.toolKinds[input.toolKind],
  ]).join(" · ");
  return { eyebrow: text.eyebrows[input.notify], task, company, note, qualification };
};

const button = (label: string, url: string, isPrimary: boolean) =>
  `<a href="${escapeHtml(url)}" style="display:inline-block;margin:0 8px 8px 0;background:${isPrimary ? COLORS.validated : COLORS.white};color:${isPrimary ? COLORS.white : COLORS.night};border:1px solid ${isPrimary ? COLORS.validated : COLORS.border};text-decoration:none;font-weight:700;font-size:15px;line-height:20px;padding:12px 24px;border-radius:10px;">${escapeHtml(label)}</a>`;

const paragraph = (content: string, style: string) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:22px;${style}">${escapeHtml(content)}</p>`;

const renderHtml = (input: ProspectReminderEmailInput, assetsUrl: string) => {
  const lines = linesOf(input);
  const buttons = [
    ...(input.phone === null ? [] : [button(text.call, telUrl(input.phone), true)]),
    button(text.open, input.companyUrl, input.phone === null),
  ].join("");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(text.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.mist};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(`${lines.eyebrow}. ${lines.company}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.mist};">
<tr>
<td align="center" style="padding:32px 12px;font-family:${FONT_STACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:${COLORS.white};border-radius:16px;overflow:hidden;color:${COLORS.night};">
<tr>
<td style="background:${COLORS.night};padding:18px 24px;">
<img src="${escapeHtml(`${assetsUrl}/email/passalio-logo-white.png`)}" width="122" height="24" alt="Passalio" style="display:block;border:0;">
</td>
</tr>
<tr>
<td style="height:4px;line-height:4px;font-size:0;background:${COLORS.mint};">&nbsp;</td>
</tr>
<tr>
<td style="padding:28px 28px 16px;text-align:left;font-family:${FONT_STACK};">
<p style="margin:0 0 6px;font-size:13px;line-height:18px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${COLORS.validated};">${escapeHtml(lines.eyebrow)}</p>
<h1 style="margin:0 0 8px;font-size:22px;line-height:28px;font-weight:800;color:${COLORS.night};">${escapeHtml(lines.task)}</h1>
${paragraph(lines.company, `color:${COLORS.slate};`)}
${lines.note === null ? "" : paragraph(lines.note, `background:${COLORS.mist};border-radius:10px;padding:12px 14px;color:${COLORS.night};`)}
${lines.qualification === "" ? "" : paragraph(lines.qualification, `font-size:14px;color:${COLORS.slate};`)}
<div style="padding-top:8px;">${buttons}</div>
</td>
</tr>
<tr>
<td style="border-top:1px solid ${COLORS.border};padding:16px 28px;font-size:12px;line-height:18px;color:${COLORS.slate};text-align:left;font-family:${FONT_STACK};">
${escapeHtml(text.footer)}
</td>
</tr>
</table>
<p style="margin:16px 0 0;font-size:12px;line-height:18px;color:${COLORS.slate};">${escapeHtml(fr.layout.tagline)}</p>
</td>
</tr>
</table>
</body>
</html>`;
};

const renderText = (input: ProspectReminderEmailInput) => {
  const lines = linesOf(input);
  return [
    lines.eyebrow,
    lines.task,
    lines.company,
    ...(lines.note === null ? [] : ["", lines.note]),
    ...(lines.qualification === "" ? [] : [lines.qualification]),
    "",
    ...(input.phone === null ? [] : [`${text.call} : ${input.phone}`]),
    `${text.open} :`,
    input.companyUrl,
    "",
    text.footer,
    "",
    fr.layout.tagline,
  ].join("\n");
};

export const prospectReminderEmail = (
  input: ProspectReminderEmailInput,
  assetsUrl: string,
): RenderedEmail => ({
  subject: text.subject(linesOf(input).task),
  html: renderHtml(input, assetsUrl),
  text: renderText(input),
});
