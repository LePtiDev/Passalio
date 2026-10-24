import type { VisitDurations } from "@passalio/trades";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";
import { visitTypeRecord } from "@/lib/db/planning-records";

const visitTypesResponse = z.object({ visitTypes: z.array(visitTypeRecord) });

export type VisitTypesResponse = z.infer<typeof visitTypesResponse>;

export const visitTypesApi = {
  fetchVisitTypes: () => apiRequest("/visit-types", visitTypesResponse),
  updateVisitDurations: (durations: VisitDurations) =>
    apiRequest("/visit-types/durations", visitTypesResponse, {
      method: "PATCH",
      body: durations,
    }),
};

export type FetchVisitTypes = typeof visitTypesApi.fetchVisitTypes;
