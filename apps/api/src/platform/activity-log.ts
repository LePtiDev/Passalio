import { activityDays } from "@passalio/db";
import { parisDay } from "@passalio/shared";
import type { Database } from "./database";

export type ActivityLog = {
  readonly recordDay: (userId: string, at: Date) => Promise<void>;
};

export const createActivityLog = (database: Database): ActivityLog => ({
  recordDay: async (userId, at) => {
    await database
      .insert(activityDays)
      .values({ userId, day: parisDay(at) })
      .onConflictDoNothing();
  },
});
