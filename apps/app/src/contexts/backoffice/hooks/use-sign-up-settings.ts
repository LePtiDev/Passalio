import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unwrap } from "@/lib/api-client";
import { settingsApi } from "../settings-api";
import { settingsFr } from "../settings-fr";

const SIGN_UP_SETTINGS_KEY = ["backoffice", "settings", "sign-up"] as const;

const text = settingsFr.signUp;

export const useSignUpSettings = () =>
  useQuery({
    queryKey: SIGN_UP_SETTINGS_KEY,
    queryFn: async () => unwrap(await settingsApi.fetchSignUp()),
  });

export const useChangeSignUpSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isSignUpOpen: boolean) =>
      unwrap(await settingsApi.changeSignUp(isSignUpOpen)),
    onSuccess: (data) => {
      queryClient.setQueryData(SIGN_UP_SETTINGS_KEY, data);
      const isOpen = data.settings.isSignUpOpen;
      toast.success(isOpen ? text.openedToast : text.closedToast, {
        description: isOpen ? text.openedToastDetail : text.closedToastDetail,
      });
    },
  });
};
