import { useMutation } from "@tanstack/react-query";
import { useSignOut } from "./use-sign-out";

export const useSignOutButton = (returnTo?: string) => {
  const { mutate, isPending } = useMutation({ mutationFn: useSignOut(returnTo) });
  return { signOut: () => mutate(), isSigningOut: isPending };
};
