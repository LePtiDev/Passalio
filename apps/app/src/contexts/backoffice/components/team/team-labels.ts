import { dayKeyOf, shortDay } from "../../calendar-labels";
import { teamFr } from "../../team-fr";

const DAY_MS = 24 * 60 * 60 * 1000;

const TIME = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export const lastSignInLabel = (iso: string | null, now: Date) => {
  if (iso === null) {
    return teamFr.never;
  }
  const date = new Date(iso);
  if (dayKeyOf(date) === dayKeyOf(now)) {
    return teamFr.today(TIME.format(date));
  }
  if (dayKeyOf(date) === dayKeyOf(new Date(now.getTime() - DAY_MS))) {
    return teamFr.yesterday(TIME.format(date));
  }
  return shortDay(date);
};

export const daysLeft = (iso: string, now: Date) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY_MS));
