import { isRedirect, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import type { RememberedCheck } from "./remembered-check";

const selectHref = (state: { readonly location: { readonly href: string } }) => state.location.href;

export const useRevalidateOnNavigation = (check: RememberedCheck<unknown>) => {
  const router = useRouter();
  const href = useRouterState({ select: selectHref });
  useEffect(() => {
    check.revalidateIfStale(href).catch((thrown: unknown) => {
      if (isRedirect(thrown)) {
        void router.navigate(thrown.options);
      }
    });
  }, [check, href, router]);
};
