const daysInMonth = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const pad = (value: number, length = 2) => String(value).padStart(length, "0");

export const addMonths = (calendarDate: string, months: number): string => {
  const [year = 0, month = 1, day = 1] = calendarDate.split("-").map(Number);
  const monthIndex = month - 1 + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
  return `${pad(targetYear, 4)}-${pad(targetMonth + 1)}-${pad(targetDay)}`;
};
