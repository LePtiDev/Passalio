import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import logo from "@/assets/passalio-logo.svg";
import { Button } from "@/components/ui/button";
import { fr } from "@/fr";
import { authClient } from "@/lib/auth-client";
import { SIGN_IN_PATH } from "@/lib/session";

export const AppHeader = () => {
  const navigate = useNavigate();
  const signOut = useCallback(async () => {
    await authClient.signOut();
    await navigate({ to: SIGN_IN_PATH, search: {} });
  }, [navigate]);
  return (
    <header className="flex items-center justify-between gap-2 border-b px-4 py-2">
      <Link to="/" className="flex h-12 items-center">
        <img src={logo} alt={fr.app.name} width={120} height={24} className="h-6 w-auto" />
      </Link>
      <nav className="flex items-center gap-1">
        <Button asChild variant="ghost" className="h-12 text-base">
          <Link to="/equipe">{fr.app.team}</Link>
        </Button>
        <Button variant="ghost" className="h-12 text-base" onClick={signOut}>
          {fr.app.signOut}
        </Button>
      </nav>
    </header>
  );
};
