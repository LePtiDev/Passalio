import { parisDay, parisInstant, shiftParisDay } from "@passalio/shared";

const PARIS = "Europe/Paris";

const CLOCK = new Intl.DateTimeFormat("fr-FR", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: PARIS,
});

const DAY_TITLE = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: PARIS,
});

const SHORT_DAY = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: PARIS,
});

const capitalized = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export const clockLabel = (at: Date): string => {
  const [hours = "", minutes = ""] = CLOCK.format(at).split(":");
  return minutes === "00" ? `${hours} h` : `${hours} h ${minutes}`;
};

export const dayTitle = (now: Date): string => capitalized(DAY_TITLE.format(now));

export const whenLabel = (at: Date, now: Date): string => {
  const day = parisDay(at);
  const today = parisDay(now);
  if (day === today) {
    return clockLabel(at);
  }
  if (day === shiftParisDay(today, -1)) {
    return `Hier, ${clockLabel(at)}`;
  }
  if (day === shiftParisDay(today, 1)) {
    return `Demain, ${clockLabel(at)}`;
  }
  return `${SHORT_DAY.format(at)}, ${clockLabel(at)}`;
};

export const dueAtOf = (date: string, time: string): string =>
  parisInstant(date, time).toISOString();

export const tomorrowOf = (now: Date): string => shiftParisDay(parisDay(now), 1);
