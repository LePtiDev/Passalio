import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { refreshWhenWorkspaceBlocked } from "./blocked-workspace-refresh";
import { SUBSCRIPTION_QUERY_KEY } from "./hooks/use-subscription";

const clientWithSubscription = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(SUBSCRIPTION_QUERY_KEY, { workspaceState: "trial" });
  return queryClient;
};

const isStale = (queryClient: QueryClient) =>
  queryClient.getQueryState(SUBSCRIPTION_QUERY_KEY)?.isInvalidated;

describe("refreshWhenWorkspaceBlocked", () => {
  it("reloads the subscription when the server says the workspace is blocked", async () => {
    const queryClient = clientWithSubscription();
    await refreshWhenWorkspaceBlocked(queryClient, { code: "workspace_blocked", traceId: "t" });
    expect(isStale(queryClient)).toBe(true);
  });

  it("leaves the subscription alone for any other error", async () => {
    const queryClient = clientWithSubscription();
    await refreshWhenWorkspaceBlocked(queryClient, { code: "forbidden", traceId: "t" });
    expect(isStale(queryClient)).toBe(false);
  });
});
