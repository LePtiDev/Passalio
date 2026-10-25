import type { EmailContent, EmailHero, RenderedEmail } from "./email-content";
import { fr } from "./fr";

export const COLORS = {
  night: "#0F2A44",
  validated: "#0E7C5A",
  mint: "#34D399",
  slate: "#475569",
  mist: "#EEF3F8",
  border: "#DCE5EE",
  white: "#FFFFFF",
} as const;

export const FONT_STACK =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (value: string) =>
  value.replaceAll(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);

const renderHero = (hero: EmailHero, assetsUrl: string) => {
  if (hero.kind === "icon") {
    return `<img src="${escapeHtml(`${assetsUrl}/email/icon-${hero.icon}.png`)}" width="64" height="64" alt="" style="display:block;margin:0 auto;border:0;">`;
  }
  const caption =
    hero.caption === null
      ? ""
      : `<div style="font-size:14px;line-height:20px;color:${COLORS.slate};">${escapeHtml(hero.caption)}</div>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.mist};border-radius:12px;">
<tr>
<td width="44" style="padding:12px 0 12px 16px;">
<div style="width:44px;height:44px;line-height:44px;border-radius:10px;background:${COLORS.night};color:${COLORS.mint};font-weight:800;font-size:16px;text-align:center;">${escapeHtml(hero.initials)}</div>
</td>
<td style="padding:12px 16px;text-align:left;">
<div style="font-size:16px;line-height:22px;font-weight:700;color:${COLORS.night};">${escapeHtml(hero.name)}</div>
${caption}
</td>
</tr>
</table>`;
};

const renderHtml = (content: EmailContent, assetsUrl: string) => {
  const actionUrl = escapeHtml(content.action.url);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(content.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.mist};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(`${content.lead} ${content.validity}.`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.mist};">
<tr>
<td align="center" style="padding:32px 12px;font-family:${FONT_STACK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:${COLORS.white};border-radius:16px;overflow:hidden;color:${COLORS.night};">
<tr>
<td align="center" style="background:${COLORS.night};padding:22px 24px;">
<img src="${escapeHtml(`${assetsUrl}/email/passalio-logo-white.png`)}" width="152" height="30" alt="Passalio" style="display:block;border:0;">
</td>
</tr>
<tr>
<td style="height:4px;line-height:4px;font-size:0;background:${COLORS.mint};">&nbsp;</td>
</tr>
<tr>
<td align="center" style="padding:40px 32px 32px;text-align:center;font-family:${FONT_STACK};">
${renderHero(content.hero, assetsUrl)}
<h1 style="margin:20px 0 8px;font-size:26px;line-height:32px;font-weight:800;color:${COLORS.night};">${escapeHtml(content.title)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:${COLORS.slate};">${escapeHtml(content.lead)}</p>
<a href="${actionUrl}" style="display:inline-block;background:${COLORS.validated};color:${COLORS.white};text-decoration:none;font-weight:700;font-size:16px;line-height:20px;padding:15px 40px;border-radius:12px;">${escapeHtml(content.action.label)}</a>
<p style="margin:20px 0 0;">
<span style="display:inline-block;background:${COLORS.mist};border-radius:999px;padding:6px 12px;font-size:13px;line-height:16px;font-weight:600;color:${COLORS.slate};"><img src="${escapeHtml(`${assetsUrl}/email/icon-clock.png`)}" width="14" height="14" alt="" style="vertical-align:-2px;border:0;">&nbsp;${escapeHtml(content.validity)}</span>
</p>
</td>
</tr>
<tr>
<td align="center" style="border-top:1px solid ${COLORS.border};padding:16px 32px;font-size:12px;line-height:18px;color:${COLORS.slate};text-align:center;font-family:${FONT_STACK};">
${escapeHtml(content.safety)} <a href="${actionUrl}" style="color:${COLORS.validated};">${escapeHtml(fr.layout.buttonFallback)}</a>
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

const renderText = (content: EmailContent) => {
  const heroLines =
    content.hero.kind === "organization"
      ? [content.hero.name, ...(content.hero.caption === null ? [] : [content.hero.caption]), ""]
      : [];
  return [
    ...heroLines,
    content.title,
    "",
    content.lead,
    "",
    `${content.action.label} :`,
    content.action.url,
    "",
    `${content.validity}.`,
    content.safety,
    "",
    fr.layout.tagline,
  ].join("\n");
};

export const renderEmail = (content: EmailContent, assetsUrl: string): RenderedEmail => ({
  subject: content.subject,
  html: renderHtml(content, assetsUrl),
  text: renderText(content),
});
