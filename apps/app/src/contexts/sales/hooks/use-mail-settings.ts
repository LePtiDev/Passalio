import type { MailSettingsChange } from "@passalio/shared";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unwrap } from "@/lib/api-client";
import { configurationFr } from "../fr-configuration";
import { mailSettingsApi } from "../mail-settings-api";
import { SALES_KEY } from "./use-sales-queries";

const mailSettingsKey = (userId: string) => [...SALES_KEY, "mail-settings", userId] as const;

export const useMailSettings = (userId: string) =>
  useQuery({
    queryKey: mailSettingsKey(userId),
    queryFn: async () => unwrap(await mailSettingsApi.fetch(userId)),
  });

const saveKey = (userId: string) => [...mailSettingsKey(userId), "save"] as const;

export const useIsSavingMailSettings = (userId: string) =>
  useIsMutating({ mutationKey: saveKey(userId) }) > 0;

export const useSaveMailSettings = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: saveKey(userId),
    mutationFn: async (change: MailSettingsChange) =>
      unwrap(await mailSettingsApi.save(userId, change)),
    onSuccess: async () => {
      toast.success(configurationFr.saved);
      await queryClient.invalidateQueries({ queryKey: mailSettingsKey(userId) });
    },
  });
};

export const useTestMailbox = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { showsErrorsInline: true },
    mutationFn: async () => unwrap(await mailSettingsApi.test(userId)),
    onSuccess: async ({ sentTo }) => {
      toast.success(configurationFr.connection.testSent(sentTo));
      await queryClient.invalidateQueries({ queryKey: mailSettingsKey(userId) });
    },
  });
};
