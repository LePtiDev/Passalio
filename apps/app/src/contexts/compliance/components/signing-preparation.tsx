import { useSigningPreparation } from "../hooks/use-signing-preparation";

export const SigningPreparation = ({ userName }: { readonly userName: string }) => {
  useSigningPreparation(userName);
  return null;
};
