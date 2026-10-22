import type { ApiError } from "./api-client";

const TRACE_HEADER = "x-trace-id";

const AUTH_ERROR_CODES: ReadonlyMap<string, string> = new Map([
  ["INVALID_EMAIL_OR_PASSWORD", "invalid_credentials"],
  ["USER_ALREADY_EXISTS", "email_already_used"],
  ["USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "email_already_used"],
  ["PASSWORD_TOO_SHORT", "weak_password"],
  ["INVALID_TOKEN", "invalid_reset_token"],
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
