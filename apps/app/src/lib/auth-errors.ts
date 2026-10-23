import type { ApiError } from "./api-client";

const TRACE_HEADER = "x-trace-id";

const AUTH_ERROR_CODES: ReadonlyMap<string, string> = new Map([
  ["INVALID_EMAIL_OR_PASSWORD", "invalid_credentials"],
  ["USER_ALREADY_EXISTS", "email_already_used"],
  ["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "email_already_used"],
  ["PASSWORD_TOO_SHORT", "weak_password"],
  ["INVALID_TOKEN", "invalid_reset_token"],
  ["VERIFICATION_FAILED", "captcha_failed"],
  ["MISSING_RESPONSE", "captcha_failed"],
  ["INVALID_CODE", "invalid_two_factor_code"],
  ["INVALID_BACKUP_CODE", "invalid_two_factor_code"],
  ["INVALID_TWO_FACTOR_COOKIE", "two_factor_expired"],
  ["TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE", "two_factor_too_many_attempts"],
  ["ACCOUNT_TEMPORARILY_LOCKED", "two_factor_too_many_attempts"],
  ["INVALID_PASSWORD", "invalid_password"],
]);

export type AuthClientError = {
  readonly status: number;
  readonly code?: string | undefined;
};

const codeOf = ({ status, code }: AuthClientError): string => {
  if (status === 429) {
    return "rate_limited";
  }
  return (code === undefined ? undefined : AUTH_ERROR_CODES.get(code)) ?? "internal";
};

export const createTraceRecorder = () => {
  let traceId: string | null = null;
  return {
    onResponse: ({ response }: { readonly response: Response }) => {
      traceId = response.headers.get(TRACE_HEADER);
    },
    toApiError: (error: AuthClientError): ApiError => ({ code: codeOf(error), traceId }),
  };
};
