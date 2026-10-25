import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { aProspectCall, aProspectTask, AT, LATER } from "./domain-fixtures";

export const PROSPECT_CALL_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "prospectCalls.record",
    query: "log a call that plans a callback",
    run: (r, s) => {
      const call = aProspectCall(s.company.id, s.contact.id, s.salesperson.id);
      return r.prospectCalls.record(
        call,
        {
          companyId: s.company.id,
          lastCallAt: call.calledAt,
          lastCallOutcome: call.outcome,
          lastCallByUserId: s.salesperson.id,
        },
        aProspectTask(s.company.id, s.contact.id, s.salesperson.id),
      );
    },
  },
  {
    method: "prospectCalls.record",
    query: "log a call without a callback",
    run: (r, s) => {
      const call = { ...aProspectCall(s.company.id, null, s.salesperson.id), nextAction: null };
      return r.prospectCalls.record(
        call,
        {
          companyId: s.company.id,
          lastCallAt: call.calledAt,
          lastCallOutcome: call.outcome,
          lastCallByUserId: s.salesperson.id,
        },
        null,
      );
    },
  },
  {
    method: "prospectCalls.ofCompany",
    query: "latest calls of a prospect company",
    run: (r, s) => r.prospectCalls.ofCompany(s.company.id, PAGE),
  },
  {
    method: "prospectCalls.countByAuthorSince",
    query: "calls of a salesperson today",
    run: (r, s) => r.prospectCalls.countByAuthorSince(s.salesperson.id, AT),
  },
  ...(["never_called", "not_reached"] as const).flatMap((target) =>
    [undefined, "69"].flatMap((department) =>
      [false, true].map((hasCursor): CatalogedQuery => ({
        method: "prospectCalls.series",
        query: `${hasCursor ? "next" : "first"} page of a call series of companies ${target.replace("_", " ")} in ${department === undefined ? "every department" : "a department"}`,
        run: (r, s) =>
          r.prospectCalls.series({
            department,
            target,
            after: hasCursor ? { searchName: "a", id: s.company.id } : undefined,
            limit: PAGE,
          }),
      })),
    ),
  ),
  {
    method: "prospectFollowUps.findByCompany",
    query: "follow-up of a prospect company",
    run: (r, s) => r.prospectFollowUps.findByCompany(s.company.id),
  },
  {
    method: "prospectFollowUps.qualify",
    query: "qualify a prospect company",
    run: (r, s) =>
      r.prospectFollowUps.qualify(s.company.id, { interest: "hot", toolKind: null }, LATER),
  },
  {
    method: "prospectTasks.findById",
    query: "a task of a prospect company",
    run: (r, s) => r.prospectTasks.findById(s.prospectTask.id),
  },
  {
    method: "prospectTasks.update",
    query: "move a task of a prospect company",
    run: (r) =>
      r.prospectTasks.update(newId(), {
        dueAt: LATER,
        notify: "at_time",
        notifyAt: LATER,
        notifiedAt: null,
        updatedAt: LATER,
      }),
  },
  {
    method: "prospectTasks.openOfCompany",
    query: "open tasks of a prospect company",
    run: (r, s) => r.prospectTasks.openOfCompany(s.company.id),
  },
  {
    method: "prospectTasks.openOfOwnerDueBefore",
    query: "open tasks of a salesperson due by tonight",
    run: (r, s) => r.prospectTasks.openOfOwnerDueBefore(s.salesperson.id, LATER, 100),
  },
  {
    method: "prospectTasks.createFromWebsite",
    query: "callback asked from the website",
    run: (r, s) =>
      r.prospectTasks.createFromWebsite({
        ...aProspectTask(s.company.id, null, s.salesperson.id),
        id: newId(),
        ownerUserId: null,
      }),
  },
  {
    method: "websiteVisitors.isAllowed",
    query: "website callback rate limit of a visitor",
    run: (r) => r.websiteVisitors.isAllowed({ ipAddress: "198.51.100.42" }, LATER),
  },
];
