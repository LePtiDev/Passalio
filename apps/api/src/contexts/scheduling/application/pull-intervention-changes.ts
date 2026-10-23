import {
  assertCan,
  changePageOf,
  SYNC_PAGE_SIZE,
  type Actor,
  type ChangeCursor,
} from "@passalio/shared";
import type { SchedulingDependencies } from "../domain/scheduling-ports";

export const pullInterventionChanges =
  ({ interventions }: Pick<SchedulingDependencies, "interventions">) =>
  async (actor: Actor, cursor: ChangeCursor | undefined) => {
    assertCan(actor, "schedule:read");
    return changePageOf(
      interventions.changesAfter(actor.organizationId, cursor, SYNC_PAGE_SIZE + 1),
      cursor,
    );
  };
