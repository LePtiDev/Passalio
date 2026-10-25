import {
  prospectCallLoggedResponse,
  prospectCallSeriesResponse,
  prospectFollowUpResponse,
  prospectMyDayResponse,
  type CallSeriesTarget,
  type ProspectCallLog,
  type ProspectQualification,
  type ProspectTaskChange,
} from "@passalio/shared";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";

const BASE = "/admin/prospects";

const nothing = z.undefined();

export type CallSeriesScope = {
  readonly department: string | null;
  readonly target: CallSeriesTarget;
  readonly size: number;
};

const seriesQuery = ({ department, target, size }: CallSeriesScope) => {
  const search = new URLSearchParams({ target, limit: String(size) });
  if (department !== null) {
    search.set("department", department);
  }
  return search.toString();
};

export const callsApi = {
  fetchMyDay: () => apiRequest(`${BASE}/my-day`, prospectMyDayResponse),
  fetchSeries: (scope: CallSeriesScope) =>
    apiRequest(`${BASE}/call-series?${seriesQuery(scope)}`, prospectCallSeriesResponse),
  fetchFollowUp: (companyId: string) =>
    apiRequest(`${BASE}/companies/${companyId}/follow-up`, prospectFollowUpResponse),
  logCall: (companyId: string, call: ProspectCallLog) =>
    apiRequest(`${BASE}/companies/${companyId}/calls`, prospectCallLoggedResponse, {
      method: "POST",
      body: call,
    }),
  qualify: (companyId: string, qualification: ProspectQualification) =>
    apiRequest(`${BASE}/companies/${companyId}/qualification`, nothing, {
      method: "PATCH",
      body: qualification,
    }),
  updateTask: (taskId: string, change: ProspectTaskChange) =>
    apiRequest(`${BASE}/tasks/${taskId}`, nothing, { method: "PATCH", body: change }),
};
