import { newId } from "@passalio/shared";
import type {
  Customer,
  Equipment,
  EquipmentPhoto,
  Site,
} from "../../src/contexts/customers/domain/customer-models";
import type { Invitation, Member } from "../../src/contexts/identity/domain/identity-models";
import type { TeamInvitation } from "../../src/contexts/platform-team/domain/team-models";
import type {
  ProspectCompany,
  ProspectContact,
  ProspectEvent,
} from "../../src/contexts/sales/domain/prospect-models";
import type { ProspectCall, ProspectTask } from "../../src/contexts/sales/domain/call-models";

export const AT = new Date("2026-10-20T08:30:00.000Z");
export const LATER = new Date("2026-10-22T16:45:00.000Z");

export const aCustomer = (organizationId: string, createdByUserId: string): Customer => ({
  id: newId(),
  organizationId,
  kind: "individual",
  civility: "mrs",
  firstName: "Camille",
  lastName: "Lefèvre",
  companyName: null,
  searchName: "lefevre camille",
  email: "camille.lefevre@exemple.fr",
  phone: "0611223344",
  secondaryPhone: null,
  billingAddress: "12 rue des Lilas",
  billingPostalCode: "69003",
  billingCity: "Lyon",
  notes: null,
  remindersOptedOutAt: null,
  createdByUserId,
  createdAt: AT,
  updatedAt: AT,
});

export const aSite = (organizationId: string, customerId: string): Site => ({
  id: newId(),
  organizationId,
  customerId,
  label: "Maison principale",
  address: "12 rue des Lilas",
  addressDetails: null,
  postalCode: "69003",
  city: "Lyon",
  buildingType: "house",
  latitude: 45.76,
  longitude: 4.85,
  occupantName: null,
  occupantPhone: null,
  accessNotes: "Portail bleu",
  createdAt: AT,
  updatedAt: AT,
});

export const anEquipment = (organizationId: string, siteId: string): Equipment => ({
  id: newId(),
  organizationId,
  siteId,
  kind: "boiler",
  energy: "gas",
  brand: "Saunier Duval",
  model: "ThemaPlus",
  serialNumber: "SD-2019-4471",
  powerKw: 24,
  room: "Cuisine",
  details: { boilerType: "condensing" },
  status: "active",
  isInstalledByUs: false,
  commissionedOn: "2019-03-01",
  installationYear: 2019,
  removedOn: null,
  replacedByEquipmentId: null,
  lastSweepingOn: "2025-10-10",
  lastServiceOn: "2025-10-10",
  nextDueDate: "2026-10-10",
  notes: null,
  createdAt: AT,
  updatedAt: AT,
});

export const aPhoto = (
  organizationId: string,
  equipmentId: string,
  createdByUserId: string,
): EquipmentPhoto => ({
  id: newId(),
  organizationId,
  equipmentId,
  kind: "plate",
  storageKey: `organizations/${organizationId}/photos/${newId()}.jpg`,
  contentType: "image/jpeg",
  takenAt: AT,
  createdByUserId,
  createdAt: AT,
  updatedAt: AT,
});

export const aMember = (organizationId: string, userId: string): Member => ({
  id: newId(),
  organizationId,
  userId,
  role: "technician",
});

export const anInvitation = (organizationId: string, inviterId: string): Invitation => ({
  id: newId(),
  organizationId,
  email: `technicien-${newId()}@exemple.fr`,
  role: "technician",
  status: "pending",
  inviterId,
  expiresAt: LATER,
});

export const aTeamInvitation = (inviterId: string): TeamInvitation => ({
  id: newId(),
  email: `commercial-${newId()}@passalio.com`,
  role: "sales",
  status: "pending",
  inviterId,
  expiresAt: LATER,
  createdAt: AT,
});

export const aProspectCompany = (ownerUserId: string): ProspectCompany => ({
  id: newId(),
  name: "Ramonage Dupuis",
  searchName: "ramonage dupuis",
  searchText: "ramonage dupuis lyon 69",
  legalName: "SARL Ramonage Dupuis",
  siren: "812345678",
  nafCode: "8122Z",
  legalForm: "SARL",
  address: "4 place Bellecour",
  postalCode: "69002",
  city: "Lyon",
  department: "69",
  latitude: 45.757,
  longitude: 4.832,
  phone: "0478000000",
  email: null,
  website: null,
  activity: "Ramonage",
  headcount: "3-5",
  currentTool: null,
  foundedOn: "2012-05-01",
  registryStatus: "active",
  notes: null,
  stage: "to_qualify",
  ownerUserId,
  sourceRef: `sirene:${newId()}`,
  createdAt: AT,
  updatedAt: AT,
});

export const aProspectContact = (companyId: string, isMain: boolean): ProspectContact => ({
  id: newId(),
  companyId,
  firstName: "Paul",
  lastName: "Dupuis",
  searchName: "dupuis paul",
  jobTitle: "Gérant",
  isLeader: true,
  isMain,
  phone: null,
  mobile: "0699887766",
  email: null,
  bestTime: "Le matin",
  createdAt: AT,
  updatedAt: AT,
});

export const aProspectEvent = (
  companyId: string,
  contactId: string | null,
  authorUserId: string,
): ProspectEvent => ({
  id: newId(),
  companyId,
  contactId,
  authorUserId,
  kind: "note",
  body: "Rappeler la semaine prochaine",
  fromStage: null,
  toStage: null,
  createdAt: AT,
});

export const aProspectCall = (
  companyId: string,
  contactId: string | null,
  authorUserId: string,
): ProspectCall => ({
  id: newId(),
  companyId,
  contactId,
  authorUserId,
  outcome: "answered",
  nextAction: "callback",
  notes: "Rappeler mardi matin",
  calledAt: AT,
});

export const aProspectTask = (
  companyId: string,
  contactId: string | null,
  ownerUserId: string,
): ProspectTask => ({
  id: newId(),
  companyId,
  contactId,
  ownerUserId,
  kind: "callback",
  dueAt: LATER,
  notify: "minutes_15",
  notifyAt: LATER,
  notifiedAt: null,
  status: "open",
  createdAt: AT,
  updatedAt: AT,
});
