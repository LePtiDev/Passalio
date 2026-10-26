import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { LATER } from "./domain-fixtures";
import { aSignedDocument, DEVICE_ID, sweepingOf } from "./field-fixtures";

const CURSOR = { updatedAt: LATER, id: newId() };

export const COMPLIANCE_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "numberBlocks.reserve",
    query: "reserve a block of certificate numbers",
    run: (r, s) =>
      r.numberBlocks.reserve({
        id: newId(),
        organizationId: s.organization.id,
        userId: s.technician.id,
        deviceId: DEVICE_ID,
        size: 20,
        at: LATER,
      }),
  },
  {
    method: "numberBlocks.findCovering",
    query: "block reserved by the signer that covers the number",
    run: (r, s) =>
      r.numberBlocks.findCovering(
        s.organization.id,
        s.technician.id,
        s.numberBlock.firstNumber + 1,
      ),
  },
  {
    method: "documents.exists",
    query: "document id already used",
    run: (r, s) => r.documents.exists(s.document.id),
  },
  {
    method: "documents.findById",
    query: "find a signed certificate",
    run: (r, s) => r.documents.findById(s.organization.id, s.document.id),
  },
  {
    method: "documents.isNumberTaken",
    query: "certificate number already used",
    run: (r, s) => r.documents.isNumberTaken(s.organization.id, s.numberBlock.firstNumber + 1),
  },
  {
    method: "documents.isCancelled",
    query: "certificate already cancelled by another",
    run: (r, s) => r.documents.isCancelled(s.organization.id, s.document.id),
  },
  {
    method: "documents.sign",
    query: "sign a certificate and update the swept equipment",
    run: (r, s) =>
      r.documents.sign(
        aSignedDocument(s.intervention, s.equipment.id, {
          number: s.numberBlock.firstNumber + 2,
          numberPrefix: s.numberBlock.numberPrefix,
        }),
        sweepingOf(s.equipment.id),
      ),
  },
  {
    method: "documents.changesAfter",
    query: "first sync page of every certificate",
    run: (r, s) => r.documents.changesAfter(s.organization.id, undefined, PAGE),
  },
  {
    method: "documents.changesAfter",
    query: "next sync page of every certificate after a cursor",
    run: (r, s) => r.documents.changesAfter(s.organization.id, CURSOR, PAGE),
  },
  {
    method: "documents.changesSignedBy",
    query: "first sync page of the certificates signed by a technician",
    run: (r, s) => r.documents.changesSignedBy(s.technician.id)(s.organization.id, undefined, PAGE),
  },
  {
    method: "documents.changesSignedBy",
    query: "next sync page of the certificates signed by a technician after a cursor",
    run: (r, s) => r.documents.changesSignedBy(s.technician.id)(s.organization.id, CURSOR, PAGE),
  },
  {
    method: "pdfArchives.pending",
    query: "signed certificates whose PDF is not archived yet",
    run: (r) => r.pdfArchives.pending(5, 3),
  },
  {
    method: "pdfArchives.markArchived",
    query: "record the archived PDF of a certificate",
    run: (r, s) =>
      r.pdfArchives.markArchived({
        documentId: s.document.id,
        organizationId: s.organization.id,
        key: "organizations/key.pdf",
        sha256: "0".repeat(64),
        at: LATER,
      }),
  },
  {
    method: "pdfArchives.markFailed",
    query: "count a failed PDF archive attempt",
    run: (r, s) => r.pdfArchives.markFailed(s.organization.id, s.document.id),
  },
  {
    method: "signingTargets.interventionOf",
    query: "intervention of the certificate",
    run: (r, s) => r.signingTargets.interventionOf(s.organization.id, s.intervention.id),
  },
  {
    method: "signingTargets.equipmentOf",
    query: "swept equipment of the certificate",
    run: (r, s) => r.signingTargets.equipmentOf(s.organization.id, s.equipment.id),
  },
];
