import type { MemberRecord } from "@/lib/db/local-records";
import { colorAt, type TechnicianColor } from "./technician-colors";

export type Technician = {
  readonly userId: string;
  readonly name: string;
  readonly firstName: string;
  readonly color: TechnicianColor;
};

const NAME_ORDER = new Intl.Collator("fr-FR", { sensitivity: "base" });

const firstNameOf = (name: string) => name.split(/\s+/).find((part) => part !== "") ?? name;

export const techniciansOf = (
  members: readonly MemberRecord[],
  actor: { readonly userId: string; readonly name: string },
): readonly Technician[] => {
  const others = members
    .filter(({ userId }) => userId !== actor.userId)
    .toSorted((left, right) => NAME_ORDER.compare(left.name, right.name));
  const self = members.find(({ userId }) => userId === actor.userId) ?? actor;
  return [self, ...others].map(({ userId, name }, index) => ({
    userId,
    name,
    firstName: firstNameOf(name),
    color: colorAt(index),
  }));
};

export const selectedTechnicians = (
  technicians: readonly Technician[],
  selection: readonly string[] | undefined,
) =>
  selection === undefined
    ? technicians
    : technicians.filter(({ userId }) => selection.includes(userId));
