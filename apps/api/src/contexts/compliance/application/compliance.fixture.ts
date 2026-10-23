import type { Actor, OrganizationRole } from "@passalio/shared";
import { CERTIFICATE_TEMPLATE_VERSION } from "@passalio/trades";
import type { ComplianceDependencies, SigningEquipment } from "../domain/compliance-ports";
import {
  createInMemoryComplianceDependencies,
  createInMemoryComplianceState,
  type InMemoryComplianceState,
} from "../infrastructure/in-memory-compliance-dependencies";
import { validCertificateData } from "./certificate-data.fixture";
import { reserveNumberBlock } from "./reserve-number-block";
import type { SignDocumentInput } from "./sign-document";

export const ORGANIZATION_A = "organization-a";
export const ORGANIZATION_B = "organization-b";
export const INTERVENTION_ID = "0190f3a0-0000-7000-8000-0000000000a1";
export const OTHER_INTERVENTION_ID = "0190f3a0-0000-7000-8000-0000000000a2";
export const EQUIPMENT_ID = "0190f3a0-0000-7000-8000-0000000000e1";
export const OTHER_EQUIPMENT_ID = "0190f3a0-0000-7000-8000-0000000000e2";
export const UNPLANNED_EQUIPMENT_ID = "0190f3a0-0000-7000-8000-0000000000e3";
export const SEALED_BOILER_ID = "0190f3a0-0000-7000-8000-0000000000e4";
export const FOREIGN_INTERVENTION_ID = "0190f3a0-0000-7000-8000-0000000000b1";
export const FOREIGN_EQUIPMENT_ID = "0190f3a0-0000-7000-8000-0000000000f1";
export const DEVICE_ID = "0190f3a0-0000-7000-8000-0000000000d1";
export const OTHER_DEVICE_ID = "0190f3a0-0000-7000-8000-0000000000d2";
export const PREFIX_A = "DUP-";

export const documentIdOf = (index: number) =>
  `0190f3a0-0000-7000-8000-${String(index).padStart(12, "0")}`;

export const actorOf = (
  role: OrganizationRole,
  overrides: Partial<Omit<Actor, "role">> = {},
): Actor => ({
  userId: `user-${role}`,
  organizationId: ORGANIZATION_A,
  isImpersonating: false,
  ...overrides,
  role,
});

export const seededComplianceState = (): InMemoryComplianceState => {
  const state = createInMemoryComplianceState();
  state.numbering.set(ORGANIZATION_A, { numberPrefix: PREFIX_A, nextDocumentNumber: 1 });
  state.numbering.set(ORGANIZATION_B, { numberPrefix: "AUT-", nextDocumentNumber: 1 });
  state.interventions.set(INTERVENTION_ID, {
    organizationId: ORGANIZATION_A,
    status: "completed",
    equipmentIds: [EQUIPMENT_ID, OTHER_EQUIPMENT_ID, SEALED_BOILER_ID],
  });
  state.interventions.set(OTHER_INTERVENTION_ID, {
    organizationId: ORGANIZATION_A,
    status: "cancelled",
    equipmentIds: [EQUIPMENT_ID],
  });
  const insert: SigningEquipment = {
    kind: "insert",
    flueType: "lined_masonry",
    lastSweepingOn: null,
  };
  state.equipments.set(EQUIPMENT_ID, { organizationId: ORGANIZATION_A, ...insert });
  state.equipments.set(OTHER_EQUIPMENT_ID, { organizationId: ORGANIZATION_A, ...insert });
  state.equipments.set(UNPLANNED_EQUIPMENT_ID, { organizationId: ORGANIZATION_A, ...insert });
  state.equipments.set(SEALED_BOILER_ID, {
    organizationId: ORGANIZATION_A,
    kind: "boiler",
    flueType: "sealed_concentric",
    lastSweepingOn: null,
  });
  state.interventions.set(FOREIGN_INTERVENTION_ID, {
    organizationId: ORGANIZATION_B,
    status: "completed",
    equipmentIds: [FOREIGN_EQUIPMENT_ID],
  });
  state.equipments.set(FOREIGN_EQUIPMENT_ID, { organizationId: ORGANIZATION_B, ...insert });
  return state;
};

export const complianceDependenciesOf = (state: InMemoryComplianceState) => {
  let clock = Date.parse("2026-10-23T10:00:00Z");
  return createInMemoryComplianceDependencies(state, () => new Date((clock += 1000)));
};

export const reserveFor = (dependencies: ComplianceDependencies, actor: Actor) =>
  reserveNumberBlock(dependencies)(actor, { deviceId: DEVICE_ID });

export const signInput = (overrides: Partial<SignDocumentInput> = {}): SignDocumentInput => ({
  documentId: documentIdOf(1),
  interventionId: INTERVENTION_ID,
  equipmentId: EQUIPMENT_ID,
  deviceId: DEVICE_ID,
  kind: "chimney_sweeping_certificate",
  templateVersion: CERTIFICATE_TEMPLATE_VERSION,
  number: 1,
  signedAt: "2026-10-23T09:30:00.000Z",
  data: validCertificateData(),
  ...overrides,
});
