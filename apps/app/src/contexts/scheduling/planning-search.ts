import * as z from "zod";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const dayParam = z.string().regex(DAY_PATTERN);

export const PLANNING_VIEWS = ["jour", "semaine"] as const;

export type PlanningView = (typeof PLANNING_VIEWS)[number];

export const planningSearch = z.object({
  jour: dayParam.optional().catch(undefined),
  vue: z.enum(PLANNING_VIEWS).optional().catch(undefined),
  agendas: z.string().max(2000).optional().catch(undefined),
  passage: z.string().max(64).optional().catch(undefined),
});

export type PlanningSearch = z.infer<typeof planningSearch>;

export const newVisitSearch = z.object({
  jour: dayParam.optional().catch(undefined),
  client: z.string().max(64).optional().catch(undefined),
  technicien: z.string().max(64).optional().catch(undefined),
});

export type NewVisitSearch = z.infer<typeof newVisitSearch>;

const AGENDA_SEPARATOR = ".";

export const agendasOf = (search: PlanningSearch): readonly string[] | undefined =>
  search.agendas === undefined
    ? undefined
    : search.agendas.split(AGENDA_SEPARATOR).filter((userId) => userId !== "");

export const agendasParam = (
  selection: readonly string[],
  allUserIds: readonly string[],
): string | undefined =>
  allUserIds.every((userId) => selection.includes(userId))
    ? undefined
    : selection.join(AGENDA_SEPARATOR);
