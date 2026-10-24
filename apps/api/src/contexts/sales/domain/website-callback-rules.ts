import { type CallbackSlot, parisDay, parisInstant, shiftParisDay } from "@passalio/shared";

const SLOT_START: Readonly<Record<CallbackSlot, string>> = {
  morning: "08:00",
  noon: "12:00",
  afternoon: "14:00",
  evening: "18:00",
};

const FIRST_SOUTH_CORSICA_POSTAL_CODE = 20000;
const FIRST_NORTH_CORSICA_POSTAL_CODE = 20200;

export const callbackDueAt = (slot: CallbackSlot, requestedAt: Date): Date =>
  parisInstant(shiftParisDay(parisDay(requestedAt), 1), SLOT_START[slot]);

export const departmentOfPostalCode = (postalCode: string): string => {
  if (postalCode.startsWith("97")) {
    return postalCode.slice(0, 3);
  }
  if (postalCode.startsWith("20")) {
    const code = Number(postalCode);
    return code >= FIRST_SOUTH_CORSICA_POSTAL_CODE && code < FIRST_NORTH_CORSICA_POSTAL_CODE
      ? "2A"
      : "2B";
  }
  return postalCode.slice(0, 2);
};

export const spacedPhone = (digits: string): string => digits.replace(/(\d{2})(?=\d)/g, "$1 ");
