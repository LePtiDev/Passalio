import { can } from "@passalio/shared";
import { defaultServiceOf, type ServiceFields, type TradeId } from "@passalio/trades";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "@/contexts/identity";
import { unwrap } from "@/lib/api-client";
import { useLocalSession } from "@/lib/db/local-database-context";
import { schedulingFr, VISIT_TYPE_LABELS } from "../fr";
import { servicesApi } from "../services-api";
import { refreshServices } from "../services-store";

export const SERVICES_QUERY_KEY = ["scheduling", "services"] as const;

const text = schedulingFr.services;

export type ServiceSave =
  | { readonly serviceId: null; readonly fields: ServiceFields }
  | { readonly serviceId: string; readonly fields: ServiceFields };

export const defaultServicesOf = (trades: readonly TradeId[]): ServiceFields[] =>
  trades.map((trade) => defaultServiceOf(trade, VISIT_TYPE_LABELS[trade]));

export const useServiceSettings = () => {
  const { database } = useLocalSession();
  const queryClient = useQueryClient();
  const { data: actor } = useActor();
  const query = useQuery({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: async () => unwrap(await refreshServices(database)).services,
  });
  const reload = () => queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
  const save = useMutation({
    meta: { showsErrorsInline: true },
    mutationFn: async ({ serviceId, fields }: ServiceSave) =>
      unwrap(
        serviceId === null
          ? await servicesApi.createService(fields)
          : await servicesApi.updateService(serviceId, fields),
      ),
    onSuccess: async (_saved, { serviceId }) => {
      await reload();
      toast.success(serviceId === null ? text.created : text.saved);
    },
  });
  const archive = useMutation({
    mutationFn: async (serviceId: string) => unwrap(await servicesApi.archiveService(serviceId)),
    onSuccess: async () => {
      await reload();
      toast.success(text.archived);
    },
  });
  const addDefaults = useMutation({
    mutationFn: (trades: readonly TradeId[]) =>
      defaultServicesOf(trades).reduce(async (previous: Promise<void>, fields) => {
        await previous;
        unwrap(await servicesApi.createService(fields));
      }, Promise.resolve()),
    onSuccess: async () => {
      await reload();
      toast.success(text.defaultsAdded);
    },
  });
  return {
    query,
    save,
    archive,
    addDefaults,
    canEdit: actor !== undefined && can(actor, "organization:update"),
  };
};
