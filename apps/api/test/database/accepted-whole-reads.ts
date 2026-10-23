export type AcceptedWholeRead = {
  readonly query: string;
  readonly step: string;
  readonly reason: string;
};

const SMALL_PROSPECT_LIST =
  "counts the whole Passalio prospect list, which stays at a few thousand rows (ADR 0017)";

export const ACCEPTED_WHOLE_READS: readonly AcceptedWholeRead[] = [
  {
    query: "prospectCompanies.countByStage: stage tabs of all departments",
    step: "SCAN prospect_companies USING COVERING INDEX prospect_companies_stage_search_name_idx",
    reason: SMALL_PROSPECT_LIST,
  },
  {
    query: "prospectCompanies.departments: departments filter",
    step: "SCAN prospect_companies USING COVERING INDEX prospect_companies_department_search_name_idx",
    reason: SMALL_PROSPECT_LIST,
  },
  {
    query: "prospectContacts.counts: contact tabs of all departments",
    step: "SCAN prospect_contacts",
    reason: SMALL_PROSPECT_LIST,
  },
];

export const acceptedStepsOf = (query: string): readonly string[] =>
  ACCEPTED_WHOLE_READS.filter((accepted) => accepted.query === query).map(({ step }) => step);
