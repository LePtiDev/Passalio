import {
  assertCan,
  can,
  changePageOf,
  SYNC_PAGE_SIZE,
  type Actor,
  type ChangeCursor,
} from "@passalio/shared";
import type { ComplianceDependencies } from "../domain/compliance-ports";

export const pullDocumentChanges =
  ({ documents }: Pick<ComplianceDependencies, "documents">) =>
  async (actor: Actor, cursor: ChangeCursor | undefined) => {
    const limit = SYNC_PAGE_SIZE + 1;
    if (can(actor, "documents:read-all")) {
      return changePageOf(documents.changesAfter(actor.organizationId, cursor, limit), cursor);
    }
    assertCan(actor, "documents:read-own");
    return changePageOf(
      documents.changesSignedBy(actor.userId)(actor.organizationId, cursor, limit),
      cursor,
    );
  };
