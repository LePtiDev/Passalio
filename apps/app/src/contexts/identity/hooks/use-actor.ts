import { useQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { identityApi } from "../identity-api";

export const ACTOR_QUERY_KEY = ["identity", "actor"] as const;

export const useActor = () =>
  useQuery({
    queryKey: ACTOR_QUERY_KEY,
    queryFn: async () => unwrap(await identityApi.fetchActor()),
  });
