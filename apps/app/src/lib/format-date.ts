const DAY_MS = 24 * 60 * 60 * 1000;

const SHORT_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

const SHORT_DATE_WITH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const LONG_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const formatLongDate = (date: Date): string => LONG_DATE.format(date);

export const formatShortDate = (date: Date): string => SHORT_DATE.format(date);

export const formatShortDateWithYear = (date: Date): string => SHORT_DATE_WITH_YEAR.format(date);

export const daysUntil = (date: Date, now: Date): number =>
  Math.ceil((date.getTime() - now.getTime()) / DAY_MS);
