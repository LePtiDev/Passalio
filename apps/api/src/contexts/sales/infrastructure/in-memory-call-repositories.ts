import type {
  ProspectCall,
  ProspectFollowUp,
  ProspectTask,
  SeriesRow,
  TaskRow,
} from "../domain/call-models";
import type { CallRepository, FollowUpRepository, TaskRepository } from "../domain/call-ports";
import type { Person, ProspectCompany } from "../domain/prospect-models";
import type { NameCursor } from "../domain/prospect-ports";
import { withChanges } from "../domain/prospect-rules";

export type InMemoryCallState = {
  readonly companies: ProspectCompany[];
  readonly calls: ProspectCall[];
  readonly followUps: ProspectFollowUp[];
  readonly tasks: ProspectTask[];
  readonly websiteTaskIds: string[];
};

type PeopleLookup = {
  readonly personOf: (userId: string | null) => Person | null;
  readonly contactPersonOf: (contactId: string | null) => Person | null;
  readonly mainContactOf: (companyId: string) => Person | null;
};

const SERIES_STAGES = new Set(["to_qualify", "qualified", "interested"]);
const NOT_REACHED = new Set(["no_answer", "voicemail"]);

const emptyFollowUp = (companyId: string, at: Date): ProspectFollowUp => ({
  companyId,
  lastCallAt: null,
  lastCallOutcome: null,
  lastCallByUserId: null,
  interest: null,
  teamSize: null,
  toolKind: null,
  certificateVolume: null,
  decisionMaker: null,
  updatedAt: at,
});

const byName = (first: NameCursor, second: NameCursor) =>
  first.searchName === second.searchName
    ? first.id.localeCompare(second.id)
    : first.searchName.localeCompare(second.searchName);

const byDueAt = (first: ProspectTask, second: ProspectTask) =>
  first.dueAt.getTime() - second.dueAt.getTime() || first.id.localeCompare(second.id);

export const createInMemoryCallRepositories = (
  state: InMemoryCallState,
  { personOf, contactPersonOf, mainContactOf }: PeopleLookup,
): {
  readonly calls: CallRepository;
  readonly followUps: FollowUpRepository;
  readonly tasks: TaskRepository;
} => {
  const followUpOf = (companyId: string) =>
    state.followUps.find((followUp) => followUp.companyId === companyId);
  const saveFollowUp = (followUp: ProspectFollowUp) => {
    const index = state.followUps.findIndex(({ companyId }) => companyId === followUp.companyId);
    if (index === -1) {
      state.followUps.push(followUp);
    } else {
      state.followUps[index] = followUp;
    }
  };
  const taskRowOf = (task: ProspectTask): TaskRow[] => {
    const company = state.companies.find(({ id }) => id === task.companyId);
    return company === undefined
      ? []
      : [
          {
            ...task,
            owner: personOf(task.ownerUserId),
            contact: contactPersonOf(task.contactId),
            company: {
              id: company.id,
              name: company.name,
              city: company.city,
              phone: company.phone,
            },
          },
        ];
  };
  const isTarget = (company: ProspectCompany, target: "never_called" | "not_reached") => {
    const followUp = followUpOf(company.id);
    return target === "never_called"
      ? (followUp?.lastCallAt ?? null) === null
      : NOT_REACHED.has(followUp?.lastCallOutcome ?? "");
  };

  return {
    calls: {
      record: async (call, lastCall, task) => {
        state.calls.push(call);
        saveFollowUp({
          ...(followUpOf(call.companyId) ?? emptyFollowUp(call.companyId, call.calledAt)),
          ...lastCall,
          updatedAt: call.calledAt,
        });
        if (task !== null) {
          state.tasks.push(task);
        }
      },
      ofCompany: async (companyId, limit) =>
        state.calls
          .filter((call) => call.companyId === companyId)
          .toSorted(
            (first, second) =>
              second.calledAt.getTime() - first.calledAt.getTime() ||
              second.id.localeCompare(first.id),
          )
          .slice(0, limit)
          .map((call) => ({
            ...call,
            author: personOf(call.authorUserId),
            contact: contactPersonOf(call.contactId),
          })),
      countByAuthorSince: async (authorUserId, since) =>
        state.calls.filter((call) => call.authorUserId === authorUserId && call.calledAt >= since)
          .length,
      series: async ({ department, target, after, limit }) =>
        state.companies
          .filter((company) => department === undefined || company.department === department)
          .filter((company) => SERIES_STAGES.has(company.stage))
          .filter((company) => isTarget(company, target))
          .flatMap((company): SeriesRow[] => {
            const followUp = followUpOf(company.id);
            return company.phone === null
              ? []
              : [
                  {
                    id: company.id,
                    name: company.name,
                    searchName: company.searchName,
                    city: company.city,
                    department: company.department,
                    phone: company.phone,
                    stage: company.stage,
                    mainContact: mainContactOf(company.id),
                    lastCallAt: followUp?.lastCallAt ?? null,
                    lastCallOutcome: followUp?.lastCallOutcome ?? null,
                    interest: followUp?.interest ?? null,
                  },
                ];
          })
          .toSorted(byName)
          .filter((row) => after === undefined || byName(row, after) > 0)
          .slice(0, limit),
    },
    followUps: {
      findByCompany: async (companyId) => followUpOf(companyId),
      qualify: async (companyId, qualification, at) =>
        saveFollowUp({
          ...withChanges(followUpOf(companyId) ?? emptyFollowUp(companyId, at), qualification),
          updatedAt: at,
        }),
    },
    tasks: {
      findById: async (taskId) => state.tasks.find(({ id }) => id === taskId),
      update: async (taskId, changes) => {
        const index = state.tasks.findIndex(({ id }) => id === taskId);
        const task = state.tasks[index];
        if (task !== undefined) {
          state.tasks[index] = withChanges(task, changes);
        }
      },
      openOfCompany: async (companyId) =>
        state.tasks
          .filter((task) => task.companyId === companyId && task.status === "open")
          .toSorted(byDueAt)
          .flatMap(taskRowOf),
      openOfOwnerDueBefore: async (ownerUserId, before, limit) =>
        state.tasks
          .filter(
            (task) =>
              (task.ownerUserId === ownerUserId || task.ownerUserId === null) &&
              task.status === "open" &&
              task.dueAt < before,
          )
          .toSorted(byDueAt)
          .slice(0, limit)
          .flatMap(taskRowOf),
      createFromWebsite: async (task) => {
        state.tasks.push(task);
        state.websiteTaskIds.push(task.id);
      },
    },
  };
};
