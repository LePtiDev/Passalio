import type { BillingContactDirectory, BillingDependencies } from "../domain/billing-ports";
import { hasFreeTechnicianSeat, isLimitedToSolo } from "../domain/technician-seats";

export const countUsedTechnicianSeats =
  (contacts: BillingContactDirectory) =>
  async (organizationId: string): Promise<number> => {
    const [technicians, pendingInvitations] = await Promise.all([
      contacts.countTechnicians(organizationId),
      contacts.countPendingTechnicianInvitations(organizationId),
    ]);
    return technicians + pendingInvitations;
  };

export const hasTechnicianSeat =
  ({ workspaces, contacts }: Pick<BillingDependencies, "workspaces" | "contacts">) =>
  async (organizationId: string): Promise<boolean> => {
    const subscription = (await workspaces.findWorkspace(organizationId))?.subscription ?? null;
    if (!isLimitedToSolo(subscription)) {
      return true;
    }
    return hasFreeTechnicianSeat(
      subscription,
      await countUsedTechnicianSeats(contacts)(organizationId),
    );
  };
