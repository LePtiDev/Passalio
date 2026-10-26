import type { StartCheckoutBody } from "@passalio/shared";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { apiErrorOf, unwrap } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { billingFr } from "../billing-fr";
import { billingApi } from "../billing-api";

const openStripePage = (url: string): void => {
  window.location.assign(url);
};

const showStripeError = (error: unknown) => {
  const codeLine = errorCodeLine(apiErrorOf(error));
  toast.error(
    billingFr.subscribed.stripeFailed,
    codeLine === undefined ? {} : { description: codeLine },
  );
};

export const useCheckout = () =>
  useMutation({
    meta: { showsErrorsInline: true },
    mutationFn: async (body: StartCheckoutBody) => unwrap(await billingApi.startCheckout(body)),
    onSuccess: ({ url }) => openStripePage(url),
    onError: showStripeError,
  });

export const useBillingPortal = () => {
  const portal = useMutation({
    meta: { showsErrorsInline: true },
    mutationFn: async () => unwrap(await billingApi.openPortal()),
    onSuccess: ({ url }) => openStripePage(url),
    onError: showStripeError,
  });
  const { mutate } = portal;
  const open = useCallback(() => mutate(), [mutate]);
  return { open, isOpening: portal.isPending || portal.isSuccess };
};
