const PARIS_WALL_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Paris",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const SECOND_IN_MS = 1000;

const wallClockMsOf = (at: Date) => {
  const parts = new Map(PARIS_WALL_CLOCK.formatToParts(at).map(({ type, value }) => [type, value]));
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.get(type));
  return Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
};

const parisOffsetMsAt = (instantMs: number) =>
  wallClockMsOf(new Date(instantMs)) - Math.floor(instantMs / SECOND_IN_MS) * SECOND_IN_MS;

const numbersOf = (value: string, separator: string) => value.split(separator).map(Number);

export const shiftParisDay = (day: string, days: number): string => {
  const [year = 0, month = 1, date = 1] = numbersOf(day, "-");
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
};

export const parisInstant = (day: string, time: string): Date => {
  const [year = 0, month = 1, date = 1] = numbersOf(day, "-");
  const [hours = 0, minutes = 0] = numbersOf(time, ":");
  const wallClockMs = Date.UTC(year, month - 1, date, hours, minutes);
  const firstGuessMs = wallClockMs - parisOffsetMsAt(wallClockMs);
  return new Date(wallClockMs - parisOffsetMsAt(firstGuessMs));
};
