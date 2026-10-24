import { ok, type Result, type ServiceLine } from "@passalio/shared";
import { checkServiceLines } from "../domain/intervention-rules";
import type { SchedulingDependencies } from "../domain/scheduling-ports";
import type { SchedulingError } from "../domain/scheduling-error";

export const checkedServiceLines = async (
  { catalog }: Pick<SchedulingDependencies, "catalog">,
  organizationId: string,
  lines: readonly ServiceLine[] | undefined,
): Promise<Result<readonly ServiceLine[] | undefined, SchedulingError>> => {
  if (lines === undefined || lines.length === 0) {
    return ok(lines);
  }
  const knownIds = await catalog.knownIds(
    organizationId,
    lines.map(({ serviceId }) => serviceId),
  );
  return checkServiceLines(lines, knownIds);
};

export const allMembers = async (
  { team }: Pick<SchedulingDependencies, "team">,
  organizationId: string,
  userIds: readonly string[],
): Promise<boolean> => {
  const memberships = await Promise.all(
    userIds.map((userId) => team.isMember(organizationId, userId)),
  );
  return memberships.every(Boolean);
};
