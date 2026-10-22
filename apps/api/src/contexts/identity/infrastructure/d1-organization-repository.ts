import { members, organizations } from "@passalio/db";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { OrganizationRepository } from "../domain/identity-ports";

const activeOrganization = (organizationId: string) =>
  and(eq(organizations.id, organizationId), isNull(organizations.deletedAt));

export const createD1OrganizationRepository = (database: Database): OrganizationRepository => ({
  createWithOwner: async (organization, owner) => {
    await database.batch([
      database.insert(organizations).values(organization),
      database.insert(members).values(owner),
    ]);
  },
  findById: async (organizationId) =>
    database
      .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
      .from(organizations)
      .where(activeOrganization(organizationId))
      .get(),
  findProfile: async (organizationId) =>
    database
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        siret: organizations.siret,
        address: organizations.address,
        phone: organizations.phone,
        teamSize: organizations.teamSize,
        trades: organizations.trades,
        brandColor: organizations.brandColor,
        documentNumberPrefix: organizations.documentNumberPrefix,
        nextDocumentNumber: organizations.nextDocumentNumber,
        logoKey: organizations.logo,
        onboardingCompletedAt: organizations.onboardingCompletedAt,
      })
      .from(organizations)
      .where(activeOrganization(organizationId))
      .get(),
  updateProfile: async (organizationId, changes) => {
    if (Object.keys(changes).length === 0) {
      return;
    }
    await database
      .update(organizations)
      .set({ ...changes, trades: changes.trades === undefined ? undefined : [...changes.trades] })
      .where(activeOrganization(organizationId));
  },
  setLogoKey: async (organizationId, logoKey) => {
    await database
      .update(organizations)
      .set({ logo: logoKey })
      .where(activeOrganization(organizationId));
  },
  completeOnboarding: async (organizationId, completedAt) => {
    await database
      .update(organizations)
      .set({ onboardingCompletedAt: completedAt })
      .where(and(activeOrganization(organizationId), isNull(organizations.onboardingCompletedAt)));
  },
});
