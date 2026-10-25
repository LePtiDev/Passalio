import {
  assertCan,
  err,
  ok,
  type Actor,
  type ComplianceMutation,
  type Result,
} from "@passalio/shared";
import {
  BRANDED_CERTIFICATE_TEMPLATE_VERSION,
  CERTIFICATE_TEMPLATE_VERSION,
  checkBrandedCertificate,
  checkCertificate,
  type CertificateError,
  type ChimneySweepingCertificate,
  type SweptEquipment,
} from "@passalio/trades";
import type { ComplianceDependencies } from "../domain/compliance-ports";
import type { ComplianceError } from "../domain/compliance-error";
import type { SignedDocument } from "../domain/document-models";
import { checkCancelledDocument, checkSigningTarget, sweepingDates } from "../domain/signing-rules";

export type SignDocumentInput = Omit<ComplianceMutation, "type">;

type CertificateCheck = (
  data: unknown,
  equipment: SweptEquipment,
) => Result<ChimneySweepingCertificate, CertificateError>;

const CERTIFICATE_CHECKS: ReadonlyMap<number, CertificateCheck> = new Map([
  [CERTIFICATE_TEMPLATE_VERSION, checkCertificate],
  [BRANDED_CERTIFICATE_TEMPLATE_VERSION, checkBrandedCertificate],
]);

const checkCancellation = async (
  { documents }: Pick<ComplianceDependencies, "documents">,
  organizationId: string,
  input: SignDocumentInput,
): Promise<Result<void, ComplianceError>> =>
  input.cancelsDocumentId === undefined
    ? ok(undefined)
    : checkCancelledDocument(
        await documents.findById(organizationId, input.cancelsDocumentId),
        input.equipmentId,
        await documents.isCancelled(organizationId, input.cancelsDocumentId),
      );

const checkNumber = async (
  { documents, numberBlocks }: Pick<ComplianceDependencies, "documents" | "numberBlocks">,
  actor: Actor,
  number: number,
) => {
  const block = await numberBlocks.findCovering(actor.organizationId, actor.userId, number);
  if (block === undefined) {
    return err("number_not_reserved" as const);
  }
  return (await documents.isNumberTaken(actor.organizationId, number))
    ? err("number_taken" as const)
    : ok(block);
};

export const signDocument =
  (dependencies: ComplianceDependencies) =>
  async (
    actor: Actor,
    input: SignDocumentInput,
  ): Promise<Result<SignedDocument, ComplianceError>> => {
    assertCan(actor, "documents:sign");
    const { documents, targets, now } = dependencies;
    if (await documents.exists(input.documentId)) {
      return err("already_exists");
    }
    const check = CERTIFICATE_CHECKS.get(input.templateVersion);
    if (check === undefined) {
      return err("unknown_template");
    }
    const equipment = checkSigningTarget(
      await targets.interventionOf(actor.organizationId, input.interventionId),
      await targets.equipmentOf(actor.organizationId, input.equipmentId),
      input.equipmentId,
    );
    if (!equipment.isOk) {
      return equipment;
    }
    const block = await checkNumber(dependencies, actor, input.number);
    if (!block.isOk) {
      return block;
    }
    const cancellation = await checkCancellation(dependencies, actor.organizationId, input);
    if (!cancellation.isOk) {
      return cancellation;
    }
    const certificate = check(input.data, equipment.value);
    if (!certificate.isOk) {
      return certificate;
    }
    const at = now();
    const document: SignedDocument = {
      id: input.documentId,
      organizationId: actor.organizationId,
      interventionId: input.interventionId,
      equipmentId: input.equipmentId,
      trade: "chimney_sweeping",
      kind: input.kind,
      templateVersion: input.templateVersion,
      number: input.number,
      numberPrefix: block.value.numberPrefix,
      deviceId: input.deviceId,
      signedByUserId: actor.userId,
      signedAt: new Date(input.signedAt),
      completedOn: certificate.value.completedOn,
      cancelsDocumentId: input.cancelsDocumentId ?? null,
      data: certificate.value,
      createdAt: at,
      updatedAt: at,
    };
    await documents.sign(document, {
      equipmentId: input.equipmentId,
      ...sweepingDates(equipment.value.lastSweepingOn, certificate.value.completedOn),
      updatedAt: at,
    });
    return ok(document);
  };
