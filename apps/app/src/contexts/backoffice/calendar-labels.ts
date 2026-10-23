import { backofficeFr } from "./fr";

const DAY_MS = 24 * 60 * 60 * 1000;

const PARIS = "Europe/Paris";

const SHORT_DAY = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: PARIS,
});
const LONG_DAY = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: PARIS,
});
const DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: PARIS,
});
const TIME = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: PARIS,
});
const SHORT_MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const LONG_MONTH = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" });
const MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: PARIS,
});

const text = backofficeFr.usage;

export const dayKeyOf = (date: Date) => DAY_KEY.format(date);

const dateOfDayKey = (day: string) => new Date(`${day}T12:00:00Z`);

const daysBetween = (from: string, to: string) =>
  Math.round((dateOfDayKey(to).getTime() - dateOfDayKey(from).getTime()) / DAY_MS);

export const shortDay = (value: string | Date) =>
  SHORT_DAY.format(typeof value === "string" ? new Date(value) : value);

export const timeOf = (iso: string) => TIME.format(new Date(iso));

export const monthYearOf = (date: Date) => MONTH_YEAR.format(date);

export const shortMonth = (month: string) => SHORT_MONTH.format(new Date(`${month}-15T00:00:00Z`));

export const longMonth = (month: string) => LONG_MONTH.format(new Date(`${month}-15T00:00:00Z`));

export const lastSeenLabel = (day: string | null, now: Date) => {
  if (day === null) {
    return text.never;
  }
  const days = daysBetween(day, dayKeyOf(now));
  if (days <= 0) {
    return text.today;
  }
  if (days === 1) {
    return text.yesterday;
  }
  return days < 31 ? text.daysAgo(days) : SHORT_DAY.format(dateOfDayKey(day));
};

export const journalDayLabel = (day: string, now: Date) => {
  const label = LONG_DAY.format(dateOfDayKey(day));
  const days = daysBetween(day, dayKeyOf(now));
  if (days === 0) {
    return backofficeFr.journal.today(label);
  }
  return days === 1 ? backofficeFr.journal.yesterday(label) : label;
};
