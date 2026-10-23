import {
  err,
  ForbiddenError,
  ok,
  type Actor,
  type ComplianceMutation,
  type Result,
} from "@passalio/shared";
import type { ComplianceDependencies } from "../domain/compliance-ports";
import type { ComplianceError } from "../domain/compliance-error";
import { signDocument } from "./sign-document";

export const applyComplianceMutation =
  (dependencies: ComplianceDependencies) =>
  async (
    actor: Actor,
    { type: _type, ...input }: ComplianceMutation,
  ): Promise<Result<void, ComplianceError | "forbidden">> => {
    try {
      const signed = await signDocument(dependencies)(actor, input);
      if (signed.isOk) {
        return ok(undefined);
      }
      const isAlreadySigned =
        signed.error === "already_exists" &&
        (await dependencies.documents.findById(actor.organizationId, input.documentId)) !==
          undefined;
      return isAlreadySigned ? ok(undefined) : err(signed.error);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return err("forbidden");
      }
      throw error;
    }
  };
