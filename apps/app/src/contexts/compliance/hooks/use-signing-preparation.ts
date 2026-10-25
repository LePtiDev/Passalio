import { useLocalSession } from "@/lib/db/local-database-context";
import { useCan } from "@/lib/permissions/use-can";
import { useIssuerSnapshot } from "./use-issuer-snapshot";
import { useNumberBlockRefill } from "./use-number-block-refill";
import { useSignerName } from "./use-signer-name";

export const useSigningPreparation = (userName: string) => {
  const { database, actor } = useLocalSession();
  const canSign = useCan("documents:sign");
  useIssuerSnapshot(database, canSign);
  useNumberBlockRefill(database, actor.userId, canSign);
  useSignerName(database, actor.userId, canSign ? userName : null);
};
