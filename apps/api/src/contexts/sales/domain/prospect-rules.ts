import { normalizeSearchText, type ProspectStage } from "@passalio/shared";

export const companySearchName = (name: string) => normalizeSearchText(name);

export const companySearchText = (company: {
  readonly name: string;
  readonly city?: string | null | undefined;
  readonly siren?: string | null | undefined;
  readonly postalCode?: string | null | undefined;
}) =>
  normalizeSearchText(
    [company.name, company.city, company.postalCode, company.siren]
      .filter((part) => part !== null && part !== undefined)
      .join(" "),
  );

export const contactNameOf = (contact: {
  readonly firstName: string | null;
  readonly lastName: string;
}) => [contact.firstName, contact.lastName].filter((part) => part !== null).join(" ");

export const contactSearchName = (contact: {
  readonly firstName: string | null;
  readonly lastName: string;
}) => normalizeSearchText([contact.lastName, contact.firstName].filter(Boolean).join(" "));

export type StageCounts = { readonly [Stage in ProspectStage | "all"]: number };

export const stageCountsOf = (
  rows: readonly { readonly stage: ProspectStage; readonly count: number }[],
): StageCounts => {
  const countOf = (stage: ProspectStage) => rows.find((row) => row.stage === stage)?.count ?? 0;
  return {
    all: rows.reduce((total, { count }) => total + count, 0),
    to_qualify: countOf("to_qualify"),
    qualified: countOf("qualified"),
    interested: countOf("interested"),
    demo_planned: countOf("demo_planned"),
    customer: countOf("customer"),
    not_interested: countOf("not_interested"),
  };
};

export const withChanges = <Current extends object>(
  current: Current,
  changes: { readonly [Key in keyof Current]?: Current[Key] | undefined },
): Current => ({
  ...current,
  ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)),
});
