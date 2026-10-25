import { newId } from "@passalio/shared";
import type { CatalogedQuery } from "./cataloged-query";
import { LATER } from "./domain-fixtures";

export const REMINDER_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "reminders.due",
    query: "open tasks whose reminder is due and not sent yet, with the last call note",
    run: (r) => r.reminders.due(LATER, 50),
  },
  {
    method: "reminders.markNotified",
    query: "remember that a reminder was sent",
    run: (r) => r.reminders.markNotified(newId(), LATER),
  },
];
