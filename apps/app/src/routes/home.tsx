import { createRoute } from "@tanstack/react-router";
import { fr } from "@/fr";
import { rootRoute } from "./root";

const HomeScreen = () => (
  <section className="flex flex-col gap-2">
    <h1 className="text-2xl font-semibold">{fr.home.title}</h1>
    <p>{fr.home.subtitle}</p>
  </section>
);

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeScreen,
});
