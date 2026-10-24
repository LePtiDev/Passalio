import type { InterestLevel, ProspectCallLog, ProspectQualification } from "@passalio/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unwrap } from "@/lib/api-client";
import { callsApi } from "../calls-api";
import { callsFr } from "../fr-calls";
import { SALES_KEY } from "./use-sales-queries";

const useRefreshCalls = () => {
  const queryClient = useQueryClient();
  return async () => queryClient.invalidateQueries({ queryKey: SALES_KEY });
};

type CallTarget = {
  readonly companyId: string;
  readonly call: ProspectCallLog;
  readonly taskId: string | null;
  readonly interest: InterestLevel | null;
};

export const useLogCall = () => {
  const refresh = useRefreshCalls();
  return useMutation({
    mutationFn: async ({ companyId, call, taskId, interest }: CallTarget) => {
      if (interest !== null) {
        unwrap(await callsApi.qualify(companyId, { interest }));
      }
      const logged = unwrap(await callsApi.logCall(companyId, call));
      if (taskId !== null) {
        unwrap(await callsApi.updateTask(taskId, { status: "done" }));
      }
      return logged;
    },
    onSuccess: () => {
      toast.success(callsFr.session.saved);
      void refresh();
    },
  });
};

export const useQualify = () => {
  const refresh = useRefreshCalls();
  return useMutation({
    mutationFn: async ({
      companyId,
      qualification,
    }: {
      readonly companyId: string;
      readonly qualification: ProspectQualification;
    }) => unwrap(await callsApi.qualify(companyId, qualification)),
    onSuccess: refresh,
  });
};
