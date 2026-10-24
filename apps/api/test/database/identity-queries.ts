import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { anInvitation, aMember, LATER } from "./domain-fixtures";

export const IDENTITY_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "organizations.createWithOwner",
    query: "create an organization with its owner",
    run: (r, s) => {
      const id = newId();
      return r.organizations.createWithOwner(
        {
          id,
          name: "Fumisterie Petit",
          slug: `fumisterie-${id}`,
          siret: null,
          address: null,
          phone: null,
          teamSize: null,
        },
        { id: newId(), organizationId: id, userId: s.owner.id, role: "owner" },
      );
    },
  },
  {
    method: "organizations.findById",
    query: "active organization",
    run: (r, s) => r.organizations.findById(s.organization.id),
  },
  {
    method: "organizations.findProfile",
    query: "organization profile",
    run: (r, s) => r.organizations.findProfile(s.organization.id),
  },
  {
    method: "organizations.updateProfile",
    query: "update the organization profile",
    run: (r, s) => r.organizations.updateProfile(s.organization.id, { phone: "0472000000" }),
  },
  {
    method: "organizations.setLogoKey",
    query: "set the organization logo",
    run: (r, s) => r.organizations.setLogoKey(s.organization.id, `logos/${s.organization.id}.png`),
  },
  {
    method: "organizations.completeOnboarding",
    query: "complete the onboarding",
    run: (r, s) => r.organizations.completeOnboarding(s.organization.id, LATER),
  },
  {
    method: "members.list",
    query: "first page of the team",
    run: (r, s) => r.members.list(s.organization.id, { limit: PAGE }),
  },
  {
    method: "members.list",
    query: "next page of the team",
    run: (r, s) => r.members.list(s.organization.id, { limit: PAGE, afterId: s.ownerMember.id }),
  },
  {
    method: "members.findById",
    query: "find a member",
    run: (r, s) => r.members.findById(s.organization.id, s.technicianMember.id),
  },
  {
    method: "members.findByUserId",
    query: "membership of the signed-in user",
    run: (r, s) => r.members.findByUserId(s.organization.id, s.owner.id),
  },
  {
    method: "members.findName",
    query: "name of the inviter",
    run: (r, s) => r.members.findName(s.organization.id, s.owner.id),
  },
  {
    method: "members.findByEmail",
    query: "member already in the team by e-mail",
    run: (r, s) => r.members.findByEmail(s.organization.id, s.technician.email),
  },
  {
    method: "members.updateRole",
    query: "change the role of a member",
    run: (r, s) => r.members.updateRole(s.organization.id, s.technicianMember.id, "secretary"),
  },
  {
    method: "members.remove",
    query: "remove a member",
    run: (r, s) => r.members.remove(s.organization.id, newId()),
  },
  {
    method: "members.transferOwnership",
    query: "transfer the ownership",
    run: (r, s) =>
      r.members.transferOwnership(s.organization.id, s.ownerMember.id, s.ownerMember.id),
  },
  {
    method: "invitations.create",
    query: "invite a member",
    run: (r, s) => r.invitations.create(anInvitation(s.organization.id, s.owner.id)),
  },
  {
    method: "invitations.findById",
    query: "find an invitation",
    run: (r, s) => r.invitations.findById(s.organization.id, s.invitation.id),
  },
  {
    method: "invitations.accept",
    query: "accept an invitation",
    run: (r, s) =>
      r.invitations.accept(
        anInvitation(s.organization.id, s.owner.id),
        aMember(s.organization.id, s.superadmin.id),
      ),
  },
  {
    method: "invitations.listPending",
    query: "first page of pending invitations",
    run: (r, s) => r.invitations.listPending(s.organization.id, { limit: PAGE }),
  },
  {
    method: "invitations.listPending",
    query: "next page of pending invitations",
    run: (r, s) =>
      r.invitations.listPending(s.organization.id, { limit: PAGE, afterId: s.invitation.id }),
  },
  {
    method: "invitations.renew",
    query: "resend an invitation",
    run: (r, s) => r.invitations.renew(s.organization.id, s.invitation.id, LATER),
  },
  {
    method: "invitations.cancel",
    query: "cancel an invitation",
    run: (r, s) => r.invitations.cancel(s.organization.id, newId()),
  },
];
