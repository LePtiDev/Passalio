import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { VisitDurations } from "@passalio/trades";
import type { VisitTypeDependencies, VisitTypeError } from "../domain/visit-type-ports";
import { mergedDurations, visitTypesOf, type VisitType } from "../domain/visit-type-rules";

export const updateVisitDurations =
  ({ settings }: VisitTypeDependencies) =>
  async (actor: Actor, changes: VisitDurations): Promise<Result<VisitType[], VisitTypeError>> => {
    assertCan(actor, "organization:update");
    const found = await settings.find(actor.organizationId);
    if (found === undefined) {
      return err("organization_not_found");
    }
    const durations = mergedDurations(found, changes);
    if (!durations.isOk) {
      return durations;
    }
    await settings.saveDurations(actor.organizationId, durations.value);
    return ok(visitTypesOf({ trades: found.trades, durations: durations.value }));
  };
