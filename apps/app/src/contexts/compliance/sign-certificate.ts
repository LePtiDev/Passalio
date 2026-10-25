import { err, ok, type Result } from "@passalio/shared";
import {
  BRANDED_CERTIFICATE_TEMPLATE_VERSION,
  checkBrandedCertificate,
  sweepingDatesAfter,
  type BrandedChimneySweepingCertificate,
  type CertificateError,
} from "@passalio/trades";
import type { DocumentIssuer } from "@/lib/db/compliance-records";
import type { LocalDatabase } from "@/lib/db/local-database";
import type { DocumentRecord, EquipmentRecord } from "@/lib/db/local-records";
import { enqueue } from "@/lib/db/outbox";
import { requestSync } from "@/lib/sync/sync-scheduler";
import { readIssuer } from "./issuer-store";
import { freeNumbers, type FreeNumber } from "./number-blocks";
import { signingDeviceIdOf } from "./signing-device";
import { sweptEquipmentOf } from "./swept-equipment";

export type CertificateBody = Omit<BrandedChimneySweepingCertificate, "company" | "branding">;

export type CertificateToSign = {
  readonly documentId: string;
  readonly equipment: EquipmentRecord;
  readonly body: CertificateBody;
};

export type SignVisitInput = {
  readonly organizationId: string;
  readonly userId: string;
  readonly interventionId: string;
  readonly signedAt: Date;
  readonly certificates: readonly CertificateToSign[];
};

export type SignCertificateInput = Omit<SignVisitInput, "certificates"> & CertificateToSign;

export type SignCertificateError =
  | CertificateError
  | "issuer_missing"
  | "legal_mentions_missing"
  | "no_number_available";

type Checked = {
  readonly target: CertificateToSign;
  readonly certificate: BrandedChimneySweepingCertificate;
};

const signedRecordOf = (
  input: SignVisitInput,
  { target, certificate }: Checked,
  { number, numberPrefix }: FreeNumber,
): DocumentRecord => {
  const at = input.signedAt.toISOString();
  return {
    id: target.documentId,
    organizationId: input.organizationId,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
    interventionId: input.interventionId,
    equipmentId: target.equipment.id,
    kind: "chimney_sweeping_certificate",
    templateVersion: BRANDED_CERTIFICATE_TEMPLATE_VERSION,
    number,
    numberPrefix,
    signedByUserId: input.userId,
    signedAt: at,
    completedOn: certificate.completedOn,
    cancelsDocumentId: null,
    data: certificate,
  };
};

const checkAll = (
  issuer: DocumentIssuer | undefined,
  input: SignVisitInput,
): Result<readonly Checked[], SignCertificateError> => {
  if (issuer === undefined) {
    return err("issuer_missing");
  }
  const { company, branding } = issuer;
  if (company === null) {
    return err("legal_mentions_missing");
  }
  const checked: Checked[] = [];
  for (const target of input.certificates) {
    const certificate = checkBrandedCertificate(
      { ...target.body, company, branding },
      sweptEquipmentOf(target.equipment),
    );
    if (!certificate.isOk) {
      return certificate;
    }
    checked.push({ target, certificate: certificate.value });
  }
  return ok(checked);
};

const store = async (database: LocalDatabase, document: DocumentRecord, checked: Checked) => {
  await database.documents.add(document);
  const equipment = await database.equipments.get(document.equipmentId);
  await database.equipments.update(document.equipmentId, {
    ...sweepingDatesAfter(equipment?.lastSweepingOn ?? null, document.completedOn),
    updatedAt: document.signedAt,
  });
  await enqueue(database, {
    type: "sign_document",
    documentId: document.id,
    interventionId: document.interventionId,
    equipmentId: document.equipmentId,
    deviceId: await signingDeviceIdOf(database),
    kind: document.kind,
    templateVersion: document.templateVersion,
    number: document.number,
    signedAt: document.signedAt,
    data: checked.certificate,
  });
};

const signInTransaction = async (
  database: LocalDatabase,
  input: SignVisitInput,
): Promise<Result<readonly DocumentRecord[], SignCertificateError>> => {
  const checked = checkAll(await readIssuer(database), input);
  if (!checked.isOk) {
    return checked;
  }
  const free = await freeNumbers(database, input.userId);
  if (free.length < checked.value.length) {
    return err("no_number_available");
  }
  const documents = checked.value.flatMap((entry, index) => {
    const number = free[index];
    return number === undefined ? [] : [{ entry, document: signedRecordOf(input, entry, number) }];
  });
  await Promise.all(documents.map(({ entry, document }) => store(database, document, entry)));
  await database.certificateDrafts.where("interventionId").equals(input.interventionId).delete();
  return ok(documents.map(({ document }) => document));
};

export const signCertificates = async (database: LocalDatabase, input: SignVisitInput) => {
  const signed = await database.transaction(
    "rw",
    [
      database.localSettings,
      database.numberBlocks,
      database.documents,
      database.equipments,
      database.outbox,
      database.certificateDrafts,
    ],
    () => signInTransaction(database, input),
  );
  if (signed.isOk) {
    requestSync(database);
  }
  return signed;
};

export const signCertificate = async (
  database: LocalDatabase,
  { documentId, equipment, body, ...visit }: SignCertificateInput,
): Promise<Result<DocumentRecord, SignCertificateError>> => {
  const signed = await signCertificates(database, {
    ...visit,
    certificates: [{ documentId, equipment, body }],
  });
  if (!signed.isOk) {
    return signed;
  }
  const [document] = signed.value;
  return document === undefined ? err("invalid_certificate") : ok(document);
};
