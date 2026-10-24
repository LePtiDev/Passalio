import type {
  ProspectCallResponse,
  ProspectCallSeriesResponse,
  ProspectFollowUpResponse,
  ProspectMyDayResponse,
  ProspectTaskResponse,
} from "@passalio/shared";

type SeriesCompany = ProspectCallSeriesResponse["companies"][number];

export const prospectTask = (
  id: string,
  overrides: Partial<ProspectTaskResponse> = {},
): ProspectTaskResponse => ({
  id,
  kind: "callback",
  status: "open",
  dueAt: "2026-10-24T12:00:00.000Z",
  notify: "minutes_15",
  notifyAt: "2026-10-24T11:45:00.000Z",
  owner: { id: "user-antho", name: "Antho" },
  contact: { id: `contact-${id}`, name: "Pascal Moreau" },
  company: {
    id: `company-${id}`,
    name: "Moreau et Fils",
    city: "Maisons-Alfort",
    phone: "01 43 00 00 00",
  },
  ...overrides,
});

export const myDay = (overrides: Partial<ProspectMyDayResponse> = {}): ProspectMyDayResponse => ({
  tasks: [],
  counts: { overdue: 0, today: 0, callsToday: 0 },
  ...overrides,
});

export const prospectCall = (
  id: string,
  overrides: Partial<ProspectCallResponse> = {},
): ProspectCallResponse => ({
  id,
  contact: null,
  author: { id: "user-antho", name: "Antho" },
  outcome: "answered",
  nextAction: null,
  notes: null,
  calledAt: "2026-10-22T08:00:00.000Z",
  ...overrides,
});

export const followUp = (
  overrides: Partial<ProspectFollowUpResponse> = {},
): ProspectFollowUpResponse => ({
  qualification: {
    interest: null,
    teamSize: null,
    toolKind: null,
    certificateVolume: null,
    decisionMaker: null,
  },
  lastCall: null,
  calls: [],
  tasks: [],
  ...overrides,
});

export const seriesCompany = (
  id: string,
  name: string,
  overrides: Partial<SeriesCompany> = {},
): SeriesCompany => ({
  id,
  name,
  city: "Créteil",
  department: "94",
  phone: "01 45 00 00 00",
  stage: "to_qualify",
  mainContact: null,
  lastCallAt: null,
  lastCallOutcome: null,
  interest: null,
  ...overrides,
});

export const callSeries = (companies: readonly SeriesCompany[]): ProspectCallSeriesResponse => ({
  companies: [...companies],
  nextCursor: null,
});
