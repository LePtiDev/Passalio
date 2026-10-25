import { useLocalSession } from "@/lib/db/local-database-context";
import { useCan } from "@/lib/permissions/use-can";
import { useIssuerSnapshot } from "./use-issuer-snapshot";
import { useNumberBlockRefill } from "./use-number-block-refill";

export const useSigningPreparation = () => {
  const { database, actor } = useLocalSession();
  const canSign = useCan("documents:sign");
  useIssuerSnapshot(database, canSign);
  useNumberBlockRefill(database, actor.userId, canSign);
};
