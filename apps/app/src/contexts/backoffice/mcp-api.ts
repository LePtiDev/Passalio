import {
  mcpAuthorizationResponse,
  mcpRedirectResponse,
  type McpAccessLevel,
} from "@passalio/shared";
import { apiRequest } from "@/lib/api-client";

const PATH = "/admin/mcp/authorization";

export const mcpApi = {
  fetchAuthorization: (query: string) => apiRequest(`${PATH}${query}`, mcpAuthorizationResponse),
  approve: (handle: string, access: McpAccessLevel) =>
    apiRequest(PATH, mcpRedirectResponse, { method: "POST", body: { handle, access } }),
  deny: (handle: string) =>
    apiRequest(`${PATH}/denial`, mcpRedirectResponse.pick({ redirectTo: true }), {
      method: "POST",
      body: { handle },
    }),
};
