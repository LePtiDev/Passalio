import { parisDay } from "@passalio/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

const PARIS_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const utcOf = (day: string) => {
  const [year = 1970, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
};

const dayOf = (date: Date) => date.toISOString().slice(0, 10);

export const todayOf = (now: Date) => parisDay(now);

export const parisMinutesOf = (now: Date) => {
  const [hours = 0, minutes = 0] = PARIS_TIME.format(now).split(":").map(Number);
  return hours * 60 + minutes;
};

export const addDays = (day: string, count: number) =>
  dayOf(new Date(utcOf(day).getTime() + count * DAY_MS));

export const weekdayIndexOf = (day: string) => (utcOf(day).getUTCDay() + 6) % 7;

export const weekStartOf = (day: string) => addDays(day, -weekdayIndexOf(day));

export const weekDaysOf = (day: string) => {
  const start = weekStartOf(day);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
};

export const isWeekend = (day: string) => weekdayIndexOf(day) >= 5;

export const dayNumberOf = (day: string) => utcOf(day).getUTCDate();

const formatterOf = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" });

const LONG_DAY = formatterOf({ weekday: "long", day: "numeric", month: "long" });
const MONTH = formatterOf({ month: "long" });
const MONTH_YEAR = formatterOf({ month: "long", year: "numeric" });
const SHORT_WEEKDAY = formatterOf({ weekday: "short" });
const DAY_MONTH = formatterOf({ day: "numeric", month: "long" });
const NUMERIC_DATE = formatterOf({ day: "2-digit", month: "2-digit", year: "numeric" });

const capitalized = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const longDayLabel = (day: string) => capitalized(LONG_DAY.format(utcOf(day)));

export const monthLabel = (day: string) => capitalized(MONTH.format(utcOf(day)));

export const monthYearLabel = (day: string) => capitalized(MONTH_YEAR.format(utcOf(day)));

export const weekdayShortLabel = (day: string) =>
  SHORT_WEEKDAY.format(utcOf(day)).toUpperCase().replace(/\.?$/, ".");

export const weekdayInitial = (day: string) =>
  SHORT_WEEKDAY.format(utcOf(day)).charAt(0).toUpperCase();

export const dayMonthLabel = (day: string) => DAY_MONTH.format(utcOf(day));

export const numericDateLabel = (day: string) => NUMERIC_DATE.format(utcOf(day));
