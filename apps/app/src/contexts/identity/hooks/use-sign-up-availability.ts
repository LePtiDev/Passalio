import { useQuery } from "@tanstack/react-query";
import { unwrap } from "@/lib/api-client";
import { identityApi } from "../identity-api";

export const useSignUpAvailability = () =>
  useQuery({
    queryKey: ["identity", "sign-up-availability"],
    queryFn: async () => unwrap(await identityApi.fetchSignUpAvailability()),
  });
