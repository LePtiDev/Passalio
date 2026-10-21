import type { Actor } from "@passalio/shared";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../../../env";
import type { UserActor } from "../domain/identity-models";
import { currentActor, currentUserActor } from "./identity-context";

export type UserEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { readonly userActor: UserActor };
};

export type ActorEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { readonly actor: Actor };
};

export const requireUser = createMiddleware<UserEnv>(async (context, next) => {
  const userActor = currentUserActor(context.var);
  if (userActor === undefined) {
    return context.json({ error: "unauthenticated", traceId: context.get("traceId") }, 401);
  }
  context.set("userActor", userActor);
  return next();
});

export const requireActor = createMiddleware<ActorEnv>(async (context, next) => {
  if (context.get("session") === null) {
    return context.json({ error: "unauthenticated", traceId: context.get("traceId") }, 401);
  }
  const actor = await currentActor(context.var, context.env);
  if (actor === undefined) {
    return context.json({ error: "no_active_organization", traceId: context.get("traceId") }, 403);
  }
  context.set("actor", actor);
  return next();
});
