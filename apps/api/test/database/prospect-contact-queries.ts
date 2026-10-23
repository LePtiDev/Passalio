import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { aProspectContact, aProspectEvent, LATER } from "./domain-fixtures";

export const PROSPECT_CONTACT_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "prospectContacts.create",
    query: "add a main contact",
    run: (r, s) => r.prospectContacts.create(aProspectContact(s.company.id, true)),
  },
  {
    method: "prospectContacts.findById",
    query: "contact file",
    run: (r, s) => r.prospectContacts.findById(s.contact.id),
  },
  {
    method: "prospectContacts.update",
    query: "make a contact the main contact",
    run: (r, s) => r.prospectContacts.update(s.contact.id, { isMain: true, updatedAt: LATER }),
  },
  {
    method: "prospectContacts.delete",
    query: "delete a contact",
    run: (r) => r.prospectContacts.delete(newId()),
  },
  {
    method: "prospectContacts.listByCompany",
    query: "contacts of a prospect company",
    run: (r, s) => r.prospectContacts.listByCompany(s.company.id),
  },
  ...(
    [
      { name: "nothing", filter: "all", department: undefined, query: undefined },
      { name: "a department", filter: "all", department: "69", query: undefined },
      { name: "leaders of a department", filter: "leaders", department: "69", query: undefined },
      {
        name: "contacts without phone",
        filter: "no_phone",
        department: undefined,
        query: undefined,
      },
      { name: "a search", filter: "all", department: undefined, query: "dupuis" },
    ] as const
  ).flatMap((page) =>
    [false, true].map((hasCursor): CatalogedQuery => ({
      method: "prospectContacts.list",
      query: `${hasCursor ? "next" : "first"} page of contacts filtered by ${page.name}`,
      run: (r, s) =>
        r.prospectContacts.list({
          filter: page.filter,
          department: page.department,
          query: page.query,
          after: hasCursor ? { searchName: "a", id: s.contact.id } : undefined,
          limit: PAGE,
        }),
    })),
  ),
  {
    method: "prospectContacts.counts",
    query: "contact tabs of a department",
    run: (r) => r.prospectContacts.counts("69"),
  },
  {
    method: "prospectEvents.add",
    query: "add a note",
    run: (r, s) =>
      r.prospectEvents.add(aProspectEvent(s.company.id, s.contact.id, s.salesperson.id)),
  },
  {
    method: "prospectEvents.ofCompany",
    query: "history of a prospect company",
    run: (r, s) => r.prospectEvents.ofCompany(s.company.id, PAGE),
  },
  {
    method: "prospectEvents.ofContact",
    query: "history of a contact",
    run: (r, s) => r.prospectEvents.ofContact(s.contact.id, PAGE),
  },
  {
    method: "prospectMainContacts.of",
    query: "main contacts of a page of companies",
    run: (r, s) => r.prospectMainContacts.of([s.company.id, newId()]),
  },
  { method: "salesPeople.owners", query: "owners filter", run: (r) => r.salesPeople.owners() },
  {
    method: "salesPeople.isOwner",
    query: "owner is a Passalio teammate",
    run: (r, s) => r.salesPeople.isOwner(s.salesperson.id),
  },
  {
    method: "salesAudit.companyDeleted",
    query: "audit a deleted prospect company",
    run: (r, s) => r.salesAudit.companyDeleted(s.salesperson.id, s.company.id),
  },
  {
    method: "prospectContacts.counts",
    query: "contact tabs of all departments",
    run: (r) => r.prospectContacts.counts(undefined),
  },
];
