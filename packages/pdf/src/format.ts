import { pdfFr } from "./fr";

const PARIS_TIME = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const partsOf = (calendarDate: string) => {
  const [year = 0, month = 1, day = 1] = calendarDate.split("-").map(Number);
  return { year, month, day };
};

export const longDate = (calendarDate: string) => {
  const { year, month, day } = partsOf(calendarDate);
  const dayLabel = day === 1 ? "1er" : String(day);
  return `${dayLabel} ${pdfFr.months[month - 1] ?? ""} ${year}`;
};

export const parisDateAndTime = (isoTimestamp: string) => {
  const parts = PARIS_TIME.formatToParts(new Date(isoTimestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return {
    date: `${part("day")}/${part("month")}/${part("year")}`,
    time: `${part("hour")}:${part("minute")}`,
    calendarDate: `${part("year")}-${part("month")}-${part("day")}`,
  };
};

export const groupedSiren = (siren: string) =>
  siren.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1\u00A0$2\u00A0$3");

export const groupedThousands = (value: number) =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
