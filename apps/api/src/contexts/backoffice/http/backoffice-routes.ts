import { Hono } from "hono";
import { requirePlatformActor, type PlatformEnv } from "./require-platform-actor";

export const backofficeRoutes = new Hono<PlatformEnv>()
  .use(requirePlatformActor)
  .get("/me", (context) => context.json({ admin: context.get("platformActor") }));
