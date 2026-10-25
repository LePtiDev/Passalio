import type { ChimneySweepingCertificate } from "@passalio/trades";
import { groupedSiren, groupedThousands } from "./format";
import { pdfFr } from "./fr";

type Company = ChimneySweepingCertificate["company"];

const nameWithForm = ({ name, legalForm }: Company) => {
  const form = pdfFr.legalForms[legalForm];
  if (form === null || new RegExp(`(^|\\s)${form}(\\s|$)`).test(name)) {
    return name;
  }
  return `${name} ${form}`;
};

export const legalLineOf = (company: Company) => {
  const text = pdfFr.footer;
  const identity =
    company.shareCapitalEuros === null
      ? nameWithForm(company)
      : `${nameWithForm(company)} ${text.shareCapital(groupedThousands(company.shareCapitalEuros))}`;
  const registry = company.registry.kind === "rcs" ? text.rcs(company.registry.city) : text.rne;
  return [
    identity,
    `${text.siren(groupedSiren(company.siren))} ${registry}`,
    text.headOffice(company.address),
  ].join(" · ");
};
