import { assertCan, err, ok, type Actor, type Result } from "@passalio/shared";
import type { VisitTypeDependencies, VisitTypeError } from "../domain/visit-type-ports";
import { visitTypesOf, type VisitType } from "../domain/visit-type-rules";

export const getVisitTypes =
  ({ settings }: VisitTypeDependencies) =>
  async (actor: Actor): Promise<Result<VisitType[], VisitTypeError>> => {
    assertCan(actor, "schedule:read");
    const found = await settings.find(actor.organizationId);
    return found === undefined ? err("organization_not_found") : ok(visitTypesOf(found));
  };
