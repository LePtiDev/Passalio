import { members, organizations } from "@passalio/db";
import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { OrganizationRepository } from "../domain/identity-ports";

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
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .get(),
});
