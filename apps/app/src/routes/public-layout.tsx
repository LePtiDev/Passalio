import type { ReactNode } from "react";
import logo from "@/assets/passalio-logo.svg";
import { fr } from "@/fr";

export const PublicLayout = ({ children }: { readonly children: ReactNode }) => (
  <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 p-4">
    <div className="flex flex-col gap-2">
      <img src={logo} alt={fr.app.name} width={160} height={32} className="h-8 w-auto self-start" />
      <p className="text-muted-foreground">{fr.app.tagline}</p>
    </div>
    {children}
  </main>
);
