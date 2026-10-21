import { ForbiddenError, type Actor, type OrganizationRole } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryIdentityDependencies,
  createInMemoryIdentityState,
  type InMemoryIdentityState,
} from "../infrastructure/in-memory-identity-dependencies";
import { acceptInvitation } from "./accept-invitation";
import { changeMemberRole } from "./change-member-role";
import { createOrganization } from "./create-organization";
import { inviteMember } from "./invite-member";
import { listMembers } from "./list-members";
import { removeMember } from "./remove-member";
import { transferOwnership } from "./transfer-ownership";

const ORGANIZATION_ID = "organization-a";
const NOW = new Date("2026-10-21T10:00:00Z");

let state: InMemoryIdentityState;
const dependencies = () => createInMemoryIdentityDependencies(state, () => NOW);

const actor = (
  role: OrganizationRole,
  userId = `user-${role}`,
  isImpersonating = false,
): Actor => ({
  userId,
  organizationId: ORGANIZATION_ID,
  role,
  isImpersonating,
});

const addMember = (role: OrganizationRole, organizationId = ORGANIZATION_ID) => {
  const userId = `user-${role}`;
  state.users.push({ id: userId, name: role, email: `${role}@example.fr` });
  state.members.push({ id: `member-${role}-${organizationId}`, organizationId, userId, role });
  return `member-${role}-${organizationId}`;
};

beforeEach(() => {
  state = createInMemoryIdentityState();
  state.organizations.push({ id: ORGANIZATION_ID, name: "Ramonage A", slug: "ramonage-a" });
  addMember("owner");
});

describe("createOrganization", () => {
  it("makes the creator the only owner and logs it", async () => {
    const result = await createOrganization(dependencies())(
      { userId: "user-new", email: "new@example.fr", isImpersonating: false },
      { name: " Ramonage  B " },
    );
    expect(result.isOk && result.value.name).toBe("Ramonage B");
    const created = state.members.filter(({ userId }) => userId === "user-new");
    expect(created.map(({ role }) => role)).toEqual(["owner"]);
    expect(state.auditEntries.map(({ action }) => action)).toEqual(["organization.created"]);
  });

  it("is refused during an impersonation", async () => {
    const result = await createOrganization(dependencies())(
      { userId: "user-new", email: "new@example.fr", isImpersonating: true },
      { name: "Ramonage B" },
    );
    expect(result).toEqual({ isOk: false, error: "impersonation_read_only" });
  });
});

describe("inviteMember", () => {
  it("lets an admin invite a technician and notifies by email", async () => {
    addMember("admin");
    const result = await inviteMember(dependencies())(actor("admin"), {
      email: " Tech@Example.FR ",
      role: "technician",
    });
    expect(result.isOk).toBe(true);
    expect(state.notifiedInvitations.map(({ email }) => email)).toEqual(["tech@example.fr"]);
    expect(state.auditEntries[0]?.data).toEqual({ role: "technician" });
  });

  it("refuses a secretary", async () => {
    await expect(
      inviteMember(dependencies())(actor("secretary"), {
        email: "tech@example.fr",
        role: "technician",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("refuses to invite a second owner", async () => {
    const result = await inviteMember(dependencies())(actor("owner"), {
      email: "tech@example.fr",
      role: "owner",
    });
    expect(result).toEqual({ isOk: false, error: "owner_role_not_assignable" });
  });

  it("refuses someone already in the team", async () => {
    addMember("technician");
    const result = await inviteMember(dependencies())(actor("owner"), {
      email: "technician@example.fr",
      role: "secretary",
    });
    expect(result).toEqual({ isOk: false, error: "already_member" });
  });
});

describe("acceptInvitation", () => {
  it("adds the invitee with the invited role", async () => {
    const invited = await inviteMember(dependencies())(actor("owner"), {
      email: "tech@example.fr",
      role: "technician",
    });
    if (!invited.isOk) {
      throw new Error("invitation failed");
    }
    const result = await acceptInvitation(dependencies())(
      { userId: "user-tech", email: "tech@example.fr", isImpersonating: false },
      { organizationId: ORGANIZATION_ID, invitationId: invited.value.id },
    );
    expect(result.isOk && result.value.role).toBe("technician");
    expect(state.invitations[0]?.status).toBe("accepted");
  });

  it("does not find an invitation through another organization", async () => {
    const invited = await inviteMember(dependencies())(actor("owner"), {
      email: "tech@example.fr",
      role: "technician",
    });
    if (!invited.isOk) {
      throw new Error("invitation failed");
    }
    const result = await acceptInvitation(dependencies())(
      { userId: "user-tech", email: "tech@example.fr", isImpersonating: false },
      { organizationId: "organization-b", invitationId: invited.value.id },
    );
    expect(result).toEqual({ isOk: false, error: "invitation_not_found" });
  });
});

describe("changeMemberRole and removeMember", () => {
  it("lets an admin promote a technician", async () => {
    addMember("admin");
    const technicianId = addMember("technician");
    const result = await changeMemberRole(dependencies())(actor("admin"), {
      memberId: technicianId,
      role: "secretary",
    });
    expect(result.isOk).toBe(true);
    expect(state.members.find(({ id }) => id === technicianId)?.role).toBe("secretary");
    expect(state.auditEntries[0]?.data).toEqual({ from: "technician", to: "secretary" });
  });

  it("never touches the owner", async () => {
    addMember("admin");
    const ownerId = `member-owner-${ORGANIZATION_ID}`;
    expect(
      await changeMemberRole(dependencies())(actor("admin"), { memberId: ownerId, role: "admin" }),
    ).toEqual({ isOk: false, error: "owner_cannot_be_changed" });
    expect(await removeMember(dependencies())(actor("admin"), { memberId: ownerId })).toEqual({
      isOk: false,
      error: "owner_cannot_be_changed",
    });
  });

  it("cannot reach a member of another organization", async () => {
    const foreignId = addMember("technician", "organization-b");
    expect(await removeMember(dependencies())(actor("owner"), { memberId: foreignId })).toEqual({
      isOk: false,
      error: "member_not_found",
    });
  });

  it("refuses a technician", async () => {
    const adminId = addMember("admin");
    await expect(
      removeMember(dependencies())(actor("technician"), { memberId: adminId }),
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("transferOwnership", () => {
  it("swaps the owner and an admin", async () => {
    const adminId = addMember("admin");
    const result = await transferOwnership(dependencies())(actor("owner"), { memberId: adminId });
    expect(result.isOk).toBe(true);
    expect(
      state.members.map(({ role }) => role).toSorted((left, right) => left.localeCompare(right)),
    ).toEqual(["admin", "owner"]);
    expect(state.members.find(({ id }) => id === adminId)?.role).toBe("owner");
  });

  it("only goes to an admin", async () => {
    const technicianId = addMember("technician");
    expect(
      await transferOwnership(dependencies())(actor("owner"), { memberId: technicianId }),
    ).toEqual({ isOk: false, error: "transfer_target_not_admin" });
  });

  it("is reserved to the owner", async () => {
    const adminId = addMember("admin");
    await expect(
      transferOwnership(dependencies())(actor("admin"), { memberId: adminId }),
    ).rejects.toThrow(ForbiddenError);
  });
});

describe("listMembers", () => {
  it("lists only the actor's organization, for every role, even during impersonation", async () => {
    addMember("technician");
    addMember("admin", "organization-b");
    const page = await listMembers(dependencies())(
      actor("technician", "user-technician", true),
      {},
    );
    expect(
      page.members.map(({ role }) => role).toSorted((left, right) => left.localeCompare(right)),
    ).toEqual(["owner", "technician"]);
    expect(page.nextCursor).toBeNull();
  });
});
