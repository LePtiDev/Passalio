import { members, users } from "@passalio/db";
import { and, asc, eq, gt } from "drizzle-orm";
import type { Database } from "../../../platform/database";
import type { MemberRepository } from "../domain/identity-ports";

const MEMBER_COLUMNS = {
  id: members.id,
  organizationId: members.organizationId,
  userId: members.userId,
  role: members.role,
};

const inOrganization = (organizationId: string) => eq(members.organizationId, organizationId);

export const createD1MemberRepository = (database: Database): MemberRepository => ({
  list: async (organizationId, { limit, afterId }) =>
    database
      .select({
        ...MEMBER_COLUMNS,
        name: users.name,
        email: users.email,
        joinedAt: members.createdAt,
      })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(
        afterId === undefined
          ? inOrganization(organizationId)
          : and(inOrganization(organizationId), gt(members.id, afterId)),
      )
      .orderBy(asc(members.id))
      .limit(limit)
      .all(),
  findById: async (organizationId, memberId) =>
    database
      .select(MEMBER_COLUMNS)
      .from(members)
      .where(and(inOrganization(organizationId), eq(members.id, memberId)))
      .get(),
  findByUserId: async (organizationId, userId) =>
    database
      .select(MEMBER_COLUMNS)
      .from(members)
      .where(and(inOrganization(organizationId), eq(members.userId, userId)))
      .get(),
  findName: async (organizationId, userId) => {
    const member = await database
      .select({ name: users.name })
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(and(inOrganization(organizationId), eq(members.userId, userId)))
      .get();
    return member?.name;
  },
  findByEmail: async (organizationId, email) =>
    database
      .select(MEMBER_COLUMNS)
      .from(members)
      .innerJoin(users, eq(users.id, members.userId))
      .where(and(inOrganization(organizationId), eq(users.email, email)))
      .get(),
  updateRole: async (organizationId, memberId, role) => {
    await database
      .update(members)
      .set({ role })
      .where(and(inOrganization(organizationId), eq(members.id, memberId)));
  },
  remove: async (organizationId, memberId) => {
    await database
      .delete(members)
      .where(and(inOrganization(organizationId), eq(members.id, memberId)));
  },
  transferOwnership: async (organizationId, fromMemberId, toMemberId) => {
    await database.batch([
      database
        .update(members)
        .set({ role: "owner" })
        .where(and(inOrganization(organizationId), eq(members.id, toMemberId))),
      database
        .update(members)
        .set({ role: "admin" })
        .where(and(inOrganization(organizationId), eq(members.id, fromMemberId))),
    ]);
  },
});
