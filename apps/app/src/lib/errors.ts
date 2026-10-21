import { toast } from "sonner";
import { fr } from "@/fr";
import { shortTraceId, type ApiError } from "./api-client";

const ERROR_MESSAGES: ReadonlyMap<string, string> = new Map(Object.entries(fr.errors.messages));

export const errorMessage = (code: string): string =>
  ERROR_MESSAGES.get(code) ?? fr.errors.messages.internal;

export const errorCodeLine = (error: ApiError): string | undefined => {
  const short = shortTraceId(error.traceId);
  return short === null ? undefined : fr.errors.code(short);
};

export const toastApiError = (error: ApiError): void => {
  const description = errorCodeLine(error);
  toast.error(errorMessage(error.code), description === undefined ? {} : { description });
};
