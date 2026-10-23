const PARIS_DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const parisDay = (at: Date): string => PARIS_DAY_FORMAT.format(at);

export const parisDayBefore = (at: Date, days: number): string =>
  parisDay(new Date(at.getTime() - days * DAY_IN_MS));

export const monthOfDay = (day: string): string => day.slice(0, 7);

export const lastMonths = (at: Date, count: number): readonly string[] => {
  const [year, month] = monthOfDay(parisDay(at)).split("-").map(Number);
  const currentIndex = (year ?? 0) * 12 + (month ?? 1) - 1;
  return Array.from({ length: count }, (_, offset) => {
    const index = currentIndex - (count - 1 - offset);
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
  });
};
