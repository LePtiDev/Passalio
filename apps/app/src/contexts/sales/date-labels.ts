const PARIS = "Europe/Paris";

const SHORT_DAY = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: PARIS,
});

const SHORT_DAY_WITH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: PARIS,
});

const YEAR = new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: PARIS });

export const shortDayLabel = (isoDate: string, now: Date): string => {
  const date = new Date(isoDate);
  return YEAR.format(date) === YEAR.format(now)
    ? SHORT_DAY.format(date)
    : SHORT_DAY_WITH_YEAR.format(date);
};
