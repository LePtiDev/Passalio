import type { BillingDependencies } from "../domain/billing-ports";
import { hasFreeTechnicianSeat, isLimitedToSolo } from "../domain/technician-seats";

export const hasTechnicianSeat =
  ({ workspaces, contacts }: Pick<BillingDependencies, "workspaces" | "contacts">) =>
  async (organizationId: string): Promise<boolean> => {
    const subscription = (await workspaces.findWorkspace(organizationId))?.subscription ?? null;
    if (!isLimitedToSolo(subscription)) {
      return true;
    }
    const [technicians, pendingInvitations] = await Promise.all([
      contacts.countTechnicians(organizationId),
      contacts.countPendingTechnicianInvitations(organizationId),
    ]);
    return hasFreeTechnicianSeat(subscription, technicians + pendingInvitations);
  };
