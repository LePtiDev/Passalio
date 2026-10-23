import { assertCan, DOCUMENT_NUMBER_BLOCK_SIZE, newId, type Actor } from "@passalio/shared";
import type { ComplianceDependencies } from "../domain/compliance-ports";
import type { NumberBlock } from "../domain/document-models";

export const reserveNumberBlock =
  ({ numberBlocks, now }: Pick<ComplianceDependencies, "numberBlocks" | "now">) =>
  async (actor: Actor, input: { readonly deviceId: string }): Promise<NumberBlock> => {
    assertCan(actor, "documents:sign");
    return numberBlocks.reserve({
      id: newId(),
      organizationId: actor.organizationId,
      userId: actor.userId,
      deviceId: input.deviceId,
      size: DOCUMENT_NUMBER_BLOCK_SIZE,
      at: now(),
    });
  };
