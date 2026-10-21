import { err, ok, type Result } from "@passalio/shared";
import * as z from "zod";

export type ApiError = {
  readonly code: string;
  readonly traceId: string | null;
};

export type ApiResult<T> = Result<T, ApiError>;

const errorBody = z.object({ error: z.string(), traceId: z.string().optional() });

const TRACE_HEADER = "x-trace-id";

type ApiRequest = {
  readonly method?: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
};

const send = async ({ method = "GET", body }: ApiRequest, path: string) =>
  fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? {} : { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

const toApiError = async (response: Response): Promise<ApiError> => {
  const parsed = errorBody.safeParse(await response.json().catch(() => null));
  return {
    code: parsed.success ? parsed.data.error : "internal",
    traceId: parsed.success
      ? (parsed.data.traceId ?? response.headers.get(TRACE_HEADER))
      : response.headers.get(TRACE_HEADER),
  };
};

export const apiRequest = async <Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  request: ApiRequest = {},
): Promise<ApiResult<z.infer<Schema>>> => {
  try {
    const response = await send(request, path);
    if (!response.ok) {
      return err(await toApiError(response));
    }
    const parsed = schema.safeParse(response.status === 204 ? undefined : await response.json());
    return parsed.success
      ? ok(parsed.data)
      : err({ code: "invalid_response", traceId: response.headers.get(TRACE_HEADER) });
  } catch {
    return err({ code: "network", traceId: null });
  }
};

export const unwrap = <T>(result: ApiResult<T>): T => {
  if (!result.isOk) {
    throw new ApiRequestError(result.error);
  }
  return result.value;
};

export class ApiRequestError extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.code);
    this.name = "ApiRequestError";
    this.apiError = apiError;
  }
}

export const shortTraceId = (traceId: string | null): string | null =>
  traceId === null ? null : traceId.slice(0, 8);

export const apiErrorOf = (error: unknown): ApiError =>
  error instanceof ApiRequestError ? error.apiError : { code: "internal", traceId: null };
