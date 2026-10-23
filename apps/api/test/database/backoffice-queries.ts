import { newId } from "@passalio/shared";
import { activityWindow } from "../../src/contexts/backoffice/domain/activity-window";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { LATER } from "./domain-fixtures";

const WINDOW = activityWindow(LATER);

export const BACKOFFICE_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "backofficeAccounts.countAccounts",
    query: "account counters of the overview",
    run: (r) => r.backofficeAccounts.countAccounts(WINDOW),
  },
  ...(["all", "trial", "dropping"] as const).map((filter): CatalogedQuery => ({
    method: "backofficeAccounts.listAccounts",
    query: `accounts list filtered by ${filter}`,
    run: (r, s) =>
      r.backofficeAccounts.listAccounts(WINDOW, {
        filter,
        query: "ramonage",
        after: { name: "A", id: s.organization.id },
        limit: PAGE,
      }),
  })),
  {
    method: "backofficeAccounts.membersOf",
    query: "members of the listed accounts",
    run: (r, s) =>
      r.backofficeAccounts.membersOf(WINDOW, [s.organization.id, s.otherOrganization.id]),
  },
  {
    method: "backofficeAccounts.monthlyActivityOf",
    query: "monthly activity of an account",
    run: (r, s) => r.backofficeAccounts.monthlyActivityOf(WINDOW, [s.organization.id]),
  },
  {
    method: "backofficeAccounts.countActivePeople",
    query: "active people of the overview",
    run: (r) => r.backofficeAccounts.countActivePeople(WINDOW),
  },
  {
    method: "backofficeAccounts.findAccount",
    query: "account file",
    run: (r, s) => r.backofficeAccounts.findAccount(s.organization.id),
  },
  {
    method: "backofficeAccounts.pendingInvitationsOf",
    query: "pending invitations of an account",
    run: (r, s) => r.backofficeAccounts.pendingInvitationsOf(s.organization.id),
  },
  {
    method: "backofficeJournal.journal",
    query: "journal of an account",
    run: (r, s) =>
      r.backofficeJournal.journal(
        { organizationId: s.organization.id },
        { createdAt: LATER, id: newId() },
        PAGE,
      ),
  },
  {
    method: "backofficeJournal.journal",
    query: "platform journal filtered by actions",
    run: (r) =>
      r.backofficeJournal.journal(
        { actions: ["platform.role_changed", "session.created"] },
        undefined,
        PAGE,
      ),
  },
];
