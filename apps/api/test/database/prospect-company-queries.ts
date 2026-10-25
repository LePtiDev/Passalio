import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { aProspectCompany, aProspectEvent, LATER } from "./domain-fixtures";

export const PROSPECT_COMPANY_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "prospectCompanies.create",
    query: "create a prospect company",
    run: (r, s) => r.prospectCompanies.create(aProspectCompany(s.salesperson.id)),
  },
  {
    method: "prospectCompanies.findById",
    query: "prospect company file",
    run: (r, s) => r.prospectCompanies.findById(s.company.id),
  },
  {
    method: "prospectCompanies.findByPhone",
    query: "prospect company or contact with the phone of a website visitor",
    run: (r) => r.prospectCompanies.findByPhone("06 12 34 56 78"),
  },
  {
    method: "prospectCompanies.update",
    query: "update a prospect company",
    run: (r, s) =>
      r.prospectCompanies.update(s.company.id, { phone: "0478111111", updatedAt: LATER }),
  },
  {
    method: "prospectCompanies.changeStage",
    query: "change the stage of a prospect company",
    run: (r, s) =>
      r.prospectCompanies.changeStage(s.company.id, "qualified", {
        ...aProspectEvent(s.company.id, null, s.salesperson.id),
        kind: "stage_changed",
        fromStage: "to_qualify",
        toStage: "qualified",
      }),
  },
  {
    method: "prospectCompanies.delete",
    query: "delete a prospect company",
    run: (r) => r.prospectCompanies.delete(newId()),
  },
  ...(
    [
      { name: "nothing", department: undefined, stage: undefined, query: undefined, owner: false },
      { name: "a department", department: "69", stage: undefined, query: undefined, owner: false },
      {
        name: "a stage",
        department: undefined,
        stage: "qualified",
        query: undefined,
        owner: false,
      },
      {
        name: "a department and a stage",
        department: "69",
        stage: "qualified",
        query: undefined,
        owner: false,
      },
      { name: "a search", department: undefined, stage: undefined, query: "dupuis", owner: false },
      {
        name: "a search in a department",
        department: "69",
        stage: undefined,
        query: "dupuis",
        owner: false,
      },
      { name: "an owner", department: undefined, stage: undefined, query: undefined, owner: true },
      {
        name: "an owner in a department",
        department: "69",
        stage: undefined,
        query: undefined,
        owner: true,
      },
    ] as const
  ).flatMap((page) =>
    [false, true].map((hasCursor): CatalogedQuery => ({
      method: "prospectCompanies.list",
      query: `${hasCursor ? "next" : "first"} page of prospect companies filtered by ${page.name}`,
      run: (r, s) =>
        r.prospectCompanies.list({
          department: page.department,
          ownerUserId: page.owner ? s.salesperson.id : undefined,
          stage: page.stage,
          query: page.query,
          after: hasCursor ? { searchName: "a", id: s.company.id } : undefined,
          limit: PAGE,
        }),
    })),
  ),
  {
    method: "prospectCompanies.countByStage",
    query: "stage tabs of all departments",
    run: (r) => r.prospectCompanies.countByStage({ department: undefined, ownerUserId: undefined }),
  },
  {
    method: "prospectCompanies.countByStage",
    query: "stage tabs of a department",
    run: (r) => r.prospectCompanies.countByStage({ department: "69", ownerUserId: undefined }),
  },
  {
    method: "prospectCompanies.summaryOf",
    query: "summary of a prospect company",
    run: (r, s) => r.prospectCompanies.summaryOf(s.company.id),
  },
  {
    method: "prospectCompanies.pins",
    query: "map pins of a department",
    run: (r) => r.prospectCompanies.pins("69", "to_qualify"),
  },
  {
    method: "prospectCompanies.pins",
    query: "map pins of every department",
    run: (r) => r.prospectCompanies.pins(undefined, undefined),
  },
  {
    method: "prospectCompanies.departments",
    query: "departments filter",
    run: (r) => r.prospectCompanies.departments(),
  },
];
