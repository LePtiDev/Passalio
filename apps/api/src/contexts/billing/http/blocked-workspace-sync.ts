import type { SyncMutation } from "@passalio/shared";
import type { Bindings, Variables } from "../../../env";
import { checkWorkspaceAccess } from "../application/check-workspace-access";
import { canWriteIn, isSignedBeforeBlock } from "../domain/workspace-access";
import { isBillingEnabled } from "../infrastructure/billing-dependencies";
import { billingDependencies } from "./billing-context";

export type SyncWriteGate = (mutation: SyncMutation) => boolean;

const OPEN_GATE: SyncWriteGate = () => true;

export const syncWriteGateOf = async (
  variables: Variables,
  bindings: Bindings,
  organizationId: string,
): Promise<SyncWriteGate> => {
  if (!isBillingEnabled(bindings)) {
    return OPEN_GATE;
  }
  const access = await checkWorkspaceAccess(billingDependencies(variables, bindings))(
    organizationId,
  );
  if (access === undefined || canWriteIn(access)) {
    return OPEN_GATE;
  }
  return (mutation) =>
    mutation.type === "sign_document" && isSignedBeforeBlock(access, new Date(mutation.signedAt));
};
