const PRORATION_VALIDITY_MS = 30 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

export const unixSecondsOf = (at: Date): number => Math.floor(at.getTime() / 1000);

export const dateOfUnixSeconds = (seconds: number): Date => new Date(seconds * 1000);

export const isFreshProrationDate = (prorationDate: number, now: Date): boolean => {
  const age = now.getTime() - dateOfUnixSeconds(prorationDate).getTime();
  return age >= -CLOCK_SKEW_MS && age <= PRORATION_VALIDITY_MS;
};
