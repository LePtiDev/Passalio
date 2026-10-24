export const CALLBACK_SLOTS = ["morning", "noon", "afternoon", "evening"] as const;

export type CallbackSlot = (typeof CALLBACK_SLOTS)[number];

export type CallbackField = "firstName" | "phone";

export interface CallbackDraft {
  firstName: string;
  company: string;
  phone: string;
  slot: string;
  message: string;
  pagePath: string;
}

export const normalizePhone = (raw: string): string =>
  raw.replace(/[\s.\-()]/g, "").replace(/^(?:\+33|0033)/, "0");

export const isFrenchPhone = (raw: string): boolean => /^0[1-9]\d{8}$/.test(normalizePhone(raw));

export const formatPhone = (raw: string): string =>
  normalizePhone(raw).replace(/(\d{2})(?=\d)/g, "$1 ");

export const isCallbackSlot = (value: string): value is CallbackSlot =>
  CALLBACK_SLOTS.some((slot) => slot === value);

export const invalidCallbackFields = (draft: CallbackDraft): ReadonlyArray<CallbackField> => [
  ...(draft.firstName.trim() === "" ? (["firstName"] as const) : []),
  ...(isFrenchPhone(draft.phone) ? [] : (["phone"] as const)),
];

export const callbackRequestBody = (draft: CallbackDraft) => ({
  firstName: draft.firstName.trim(),
  company: draft.company.trim() === "" ? null : draft.company.trim(),
  phone: normalizePhone(draft.phone),
  slot: isCallbackSlot(draft.slot) ? draft.slot : CALLBACK_SLOTS[0],
  message: draft.message.trim() === "" ? null : draft.message.trim(),
  pagePath: draft.pagePath,
});

export const shortTraceId = (traceId: string | null): string | null =>
  traceId === null || traceId === "" ? null : traceId.slice(0, 8);
