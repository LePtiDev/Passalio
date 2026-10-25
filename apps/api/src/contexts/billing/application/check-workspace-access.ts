import type { BillingDependencies } from "../domain/billing-ports";
import { workspaceAccessOf, type WorkspaceAccess } from "../domain/workspace-access";

export const checkWorkspaceAccess =
  ({ workspaces, now }: Pick<BillingDependencies, "workspaces" | "now">) =>
  async (organizationId: string): Promise<WorkspaceAccess | undefined> => {
    const workspace = await workspaces.findWorkspace(organizationId);
    return workspace === undefined ? undefined : workspaceAccessOf({ ...workspace, now: now() });
  };
