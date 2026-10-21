import { createRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { fr } from "@/fr";
import { signedInRoute } from "./signed-in-layout";

const HomeScreen = () => (
  <section className="flex flex-col gap-4">
    <h1 className="text-2xl font-bold">{fr.home.title}</h1>
    <p className="text-muted-foreground">{fr.home.subtitle}</p>
    <Button asChild className="h-12 text-base">
      <Link to="/equipe">{fr.home.teamLink}</Link>
    </Button>
  </section>
);

export const homeRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/",
  component: HomeScreen,
});
