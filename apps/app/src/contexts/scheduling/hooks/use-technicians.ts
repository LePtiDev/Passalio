import { can, type Permission } from "@passalio/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo } from "react";
import { useActor } from "@/contexts/identity";
import { useLocalSession } from "@/lib/db/local-database-context";
import { readOfflineSession } from "@/lib/offline-session";
import { refreshMembers } from "../members-store";
import { techniciansOf } from "../technicians";

export const useTechnicians = () => {
  const { database, actor } = useLocalSession();
  const members = useLiveQuery(() => database.members.toArray(), [database]);
  const { data: onlineActor } = useActor();
  useEffect(() => {
    if (navigator.onLine) {
      void refreshMembers(database);
    }
  }, [database]);
  return useMemo(() => {
    if (members === undefined) {
      return undefined;
    }
    const self = members.find(({ userId }) => userId === actor.userId);
    const role = onlineActor?.role ?? self?.role;
    const isAllowed = (permission: Permission) =>
      role !== undefined &&
      can(
        {
          userId: actor.userId,
          organizationId: actor.organizationId,
          role,
          isImpersonating: onlineActor?.isImpersonating ?? false,
        },
        permission,
      );
    const technicians = techniciansOf(members, {
      userId: actor.userId,
      name: self?.name ?? readOfflineSession()?.name ?? "",
    });
    return {
      technicians,
      self: technicians.filter(({ userId }) => userId === actor.userId),
      canPlan: isAllowed("schedule:write"),
    };
  }, [members, onlineActor, actor]);
};

export type TechnicianState = NonNullable<ReturnType<typeof useTechnicians>>;
