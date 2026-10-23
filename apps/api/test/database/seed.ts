import { sessions, users } from "@passalio/db";
import { newId } from "@passalio/shared";
import type { Database } from "../../src/platform/database";
import { signUp } from "./auth-sessions";
import {
  aCustomer,
  anEquipment,
  anInvitation,
  aPhoto,
  aProspectCompany,
  aProspectContact,
  aProspectEvent,
  aSite,
  AT,
  aTeamInvitation,
  LATER,
} from "./domain-fixtures";
import {
  aPlateReading,
  aSignedDocument,
  anIntervention,
  DEVICE_ID,
  sweepingOf,
} from "./field-fixtures";
import { TRACE_ID, type Repositories } from "./repositories";

const aUser = (name: string, role: "user" | "superadmin" | "sales") => ({
  id: newId(),
  name,
  email: `${name.toLowerCase().replaceAll(" ", ".")}-${newId()}@exemple.fr`,
  emailVerified: true,
  role,
  createdAt: AT,
  updatedAt: AT,
});

const anOrganization = (name: string) => ({
  id: newId(),
  name,
  slug: `${name.toLowerCase().replaceAll(" ", "-")}-${newId()}`,
  siret: "81234567800012",
  address: "4 place Bellecour, 69002 Lyon",
  phone: "0478000000",
  teamSize: null,
});

export const seedDatabase = async (database: Database, repositories: Repositories) => {
  const owner = aUser("Claire Martin", "user");
  const technician = aUser("Hugo Bernard", "user");
  const superadmin = aUser("Quentin Admin", "superadmin");
  const salesperson = aUser("Lina Commerciale", "sales");
  await database.insert(users).values([owner, technician, superadmin, salesperson]);

  const organization = anOrganization("Ramonage Martin");
  const otherOrganization = anOrganization("Chauffage Durand");
  const ownerMember = {
    id: newId(),
    organizationId: organization.id,
    userId: owner.id,
    role: "owner",
  } as const;
  const technicianMember = {
    id: newId(),
    organizationId: organization.id,
    userId: technician.id,
    role: "technician",
  } as const;
  await repositories.organizations.createWithOwner(organization, ownerMember);
  await repositories.organizations.createWithOwner(otherOrganization, {
    id: newId(),
    organizationId: otherOrganization.id,
    userId: technician.id,
    role: "owner",
  });
  await repositories.invitations.accept(anInvitation(organization.id, owner.id), technicianMember);

  const customer = aCustomer(organization.id, owner.id);
  const site = aSite(organization.id, customer.id);
  const equipment = anEquipment(organization.id, site.id);
  const photo = aPhoto(organization.id, equipment.id, technician.id);
  await repositories.customers.create(customer, site);
  await repositories.customers.create(aCustomer(otherOrganization.id, technician.id), undefined);
  await repositories.equipments.create(equipment);
  await repositories.photos.create(photo);
  await repositories.plateReadings.create(aPlateReading(organization.id, technician.id));

  const invitation = anInvitation(organization.id, owner.id);
  await repositories.invitations.create(invitation);

  const intervention = anIntervention(
    organization.id,
    { customerId: customer.id, siteId: site.id, equipmentId: equipment.id },
    technician.id,
  );
  await repositories.interventions.create(intervention);
  const numberBlock = await repositories.numberBlocks.reserve({
    id: newId(),
    organizationId: organization.id,
    userId: technician.id,
    deviceId: DEVICE_ID,
    size: 20,
    at: AT,
  });
  const document = aSignedDocument(intervention, equipment.id, {
    number: numberBlock.firstNumber,
    numberPrefix: numberBlock.numberPrefix,
  });
  await repositories.documents.sign(document, sweepingOf(equipment.id));

  const company = aProspectCompany(salesperson.id);
  const contact = aProspectContact(company.id, true);
  await repositories.prospectCompanies.create(company);
  await repositories.prospectContacts.create(contact);
  await repositories.prospectEvents.add(aProspectEvent(company.id, contact.id, salesperson.id));

  const teamInvitation = aTeamInvitation(superadmin.id);
  await repositories.teamInvitations.create(teamInvitation);

  await repositories.activityLog.recordDay(owner.id, AT);
  await repositories.activityLog.recordDay(technician.id, LATER);
  await repositories.auditTrail.record({
    organizationId: organization.id,
    actorUserId: owner.id,
    action: "member.invited",
    targetType: "invitation",
    targetId: invitation.id,
  });
  await database.insert(sessions).values({
    id: newId(),
    userId: superadmin.id,
    token: newId(),
    expiresAt: LATER,
    createdAt: AT,
    updatedAt: AT,
  });

  const sessionCookie = await signUp(database, TRACE_ID, `nadia.roux-${newId()}@exemple.fr`);

  return {
    sessionCookie,
    owner,
    technician,
    superadmin,
    salesperson,
    organization,
    otherOrganization,
    ownerMember,
    technicianMember,
    customer,
    site,
    equipment,
    photo,
    invitation,
    intervention,
    numberBlock,
    document,
    company,
    contact,
    teamInvitation,
  };
};

export type Seeded = Awaited<ReturnType<typeof seedDatabase>>;
