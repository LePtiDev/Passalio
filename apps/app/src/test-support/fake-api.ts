import { vi } from "vitest";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type FakeRoute = `${Method} /${string}`;

export type FakeReply = {
  readonly status: number;
  readonly body: unknown;
  readonly delayMs?: number;
  readonly until?: Promise<void>;
};

export type FakeRequest = {
  readonly method: string;
  readonly path: string;
  readonly search: URLSearchParams;
  readonly body: unknown;
};

type ReplyOrHandler = FakeReply | ((request: FakeRequest) => FakeReply);

export type FakeRoutes = Readonly<Record<FakeRoute, ReplyOrHandler>>;

export const UNMATCHED_TRACE_ID = "unmatched-route";

export const jsonReply = (body: unknown, status = 200): FakeReply => ({ status, body });

export const errorReply = (error: string, traceId: string, status = 500): FakeReply => ({
  status,
  body: { error, traceId },
});

export const delayedReply = (reply: FakeReply, delayMs: number): FakeReply => ({
  ...reply,
  delayMs,
});

export const heldReply = (reply: FakeReply) => {
  const gate: { open?: () => void } = {};
  const until = new Promise<void>((resolve) => {
    gate.open = resolve;
  });
  return { reply: { ...reply, until }, release: () => gate.open?.() };
};

const urlOf = (input: RequestInfo | URL) => {
  if (typeof input === "string") {
    return new URL(input, "http://localhost");
  }
  return input instanceof URL ? input : new URL(input.url, "http://localhost");
};

const bodyOf = (init: RequestInit | undefined): unknown => {
  if (typeof init?.body !== "string") {
    return init?.body ?? undefined;
  }
  try {
    return JSON.parse(init.body);
  } catch {
    return init.body;
  }
};

const wait = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs));

const responseOf = (reply: FakeReply) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (typeof reply.body === "object" && reply.body !== null && "traceId" in reply.body) {
    headers.set("x-trace-id", String(reply.body.traceId));
  }
  const body = reply.status === 204 ? null : JSON.stringify(reply.body);
  return new Response(body, { status: reply.status, headers });
};

export const installFakeApi = (initialRoutes: FakeRoutes = {}) => {
  const routes = new Map<string, ReplyOrHandler>(Object.entries(initialRoutes));
  const requests: FakeRequest[] = [];
  const unmatched: FakeRequest[] = [];

  const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const url = urlOf(input);
    const request: FakeRequest = {
      method: (init?.method ?? "GET").toUpperCase(),
      path: url.pathname,
      search: url.searchParams,
      body: bodyOf(init),
    };
    requests.push(request);
    const route = routes.get(`${request.method} ${request.path}`);
    if (route === undefined) {
      unmatched.push(request);
      return responseOf(errorReply("not_found", UNMATCHED_TRACE_ID, 404));
    }
    const reply = typeof route === "function" ? route(request) : route;
    if (reply.delayMs !== undefined) {
      await wait(reply.delayMs);
    }
    if (reply.until !== undefined) {
      await reply.until;
    }
    return responseOf(reply);
  });

  vi.stubGlobal("fetch", fetch);

  return {
    fetch,
    requests,
    unmatched,
    setRoute: (route: FakeRoute, reply: ReplyOrHandler) => {
      routes.set(route, reply);
    },
    requestsTo: (route: FakeRoute) =>
      requests.filter(({ method, path }) => `${method} ${path}` === route),
  };
};

export type FakeApi = ReturnType<typeof installFakeApi>;
