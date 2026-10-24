import { can } from "@passalio/shared";
import type { VisitDurations } from "@passalio/trades";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "@/contexts/identity";
import { unwrap } from "@/lib/api-client";
import { useLocalSession } from "@/lib/db/local-database-context";
import { schedulingFr } from "../fr";
import { inTradeOrder } from "../visit-types";
import { visitTypesApi, type VisitTypesResponse } from "../visit-types-api";
import { saveVisitTypes } from "../visit-types-store";

export const VISIT_TYPES_QUERY_KEY = ["scheduling", "visit-types"] as const;

export const useVisitTypeSettings = () => {
  const { database } = useLocalSession();
  const queryClient = useQueryClient();
  const { data: actor } = useActor();
  const query = useQuery({
    queryKey: VISIT_TYPES_QUERY_KEY,
    queryFn: async () => {
      const { visitTypes } = unwrap(await visitTypesApi.fetchVisitTypes());
      await saveVisitTypes(database, visitTypes);
      return inTradeOrder(visitTypes);
    },
  });
  const update = useMutation({
    meta: { showsErrorsInline: true },
    mutationFn: async (durations: VisitDurations) =>
      unwrap(await visitTypesApi.updateVisitDurations(durations)),
    onSuccess: async ({ visitTypes }: VisitTypesResponse) => {
      queryClient.setQueryData(VISIT_TYPES_QUERY_KEY, inTradeOrder(visitTypes));
      await saveVisitTypes(database, visitTypes);
      toast.success(schedulingFr.visitTypes.saved);
    },
  });
  return {
    query,
    update,
    canEdit: actor !== undefined && can(actor, "organization:update"),
  };
};
