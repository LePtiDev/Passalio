import { can, type Permission } from "@passalio/shared";
import { useActor } from "@/contexts/identity/hooks/use-actor";

export const useCan = (permission: Permission): boolean => {
  const { data: actor } = useActor();
  return actor !== undefined && can(actor, permission);
};
