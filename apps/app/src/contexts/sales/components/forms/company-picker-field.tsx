import type { ProspectCompanySummaryResponse } from "@passalio/shared";
import { useCallback, useMemo, useState } from "react";
import { useController } from "react-hook-form";
import { InitialsAvatar } from "@/components/initials-avatar";
import { SearchField } from "@/components/search-field";
import { Label } from "@/components/ui/label";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { salesFr } from "../../fr";
import { useCompanies } from "../../hooks/use-sales-queries";
import { ERROR_TEXT_CLASS, LABEL_CLASS } from "../sales-styles";
import type { ContactFormValues } from "./contact-form-schema";

const text = salesFr.contactForm;

const SEARCH_DELAY_MS = 300;

const MAX_RESULTS = 5;

const Choice = ({
  company,
  onChoose,
}: {
  readonly company: ProspectCompanySummaryResponse;
  readonly onChoose: (company: ProspectCompanySummaryResponse) => void;
}) => {
  const choose = useCallback(() => onChoose(company), [company, onChoose]);
  return (
    <li className="border-b border-[#EEF2F6] last:border-b-0">
      <button
        type="button"
        onClick={choose}
        className="flex min-h-12 w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#F7F9FB] lg:min-h-10"
      >
        <InitialsAvatar name={company.name} tone="amber" size="small" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-semibold lg:text-[13px]">{company.name}</span>
          <span className="truncate text-[13px] text-[#64748B] lg:text-xs">
            {company.city ?? company.department}
          </span>
        </span>
      </button>
    </li>
  );
};

export const CompanyPickerField = () => {
  const { field, fieldState } = useController<ContactFormValues, "companyId">({
    name: "companyId",
  });
  const { onChange } = field;
  const [chosen, setChosen] = useState<ProspectCompanySummaryResponse | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const scope = useMemo(
    () => ({ stage: null, department: null, owner: null, search: debouncedSearch }),
    [debouncedSearch],
  );
  const companies = useCompanies(scope);
  const results = companies.data?.pages[0]?.companies.slice(0, MAX_RESULTS) ?? [];
  const choose = useCallback(
    (company: ProspectCompanySummaryResponse) => {
      setChosen(company);
      onChange(company.id);
    },
    [onChange],
  );
  const change = useCallback(() => {
    setChosen(null);
    onChange("");
  }, [onChange]);
  return (
    <div className="flex flex-col gap-1.5 lg:col-span-2">
      <Label className={LABEL_CLASS}>{text.company}</Label>
      {chosen === null ? (
        <>
          <SearchField
            value={search}
            label={text.companyPlaceholder}
            placeholder={text.companyPlaceholder}
            onChange={setSearch}
            className="lg:w-full"
          />
          {companies.isSuccess ? (
            results.length === 0 ? (
              <p className="text-[13px] text-[#64748B]">{text.companyEmpty}</p>
            ) : (
              <ul className="overflow-hidden rounded-[10px] border border-[#E3E8EF] lg:rounded-[7px]">
                {results.map((company) => (
                  <Choice key={company.id} company={company} onChoose={choose} />
                ))}
              </ul>
            )
          ) : null}
        </>
      ) : (
        <div className="flex min-h-12 items-center gap-3 rounded-[10px] border border-[#E3E8EF] px-3 lg:min-h-10 lg:rounded-[7px]">
          <InitialsAvatar name={chosen.name} tone="amber" size="small" />
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold lg:text-[13px]">
            {chosen.name}
          </span>
          <button
            type="button"
            onClick={change}
            className="h-12 text-[13px] font-semibold text-[#0E7C5A] lg:h-8"
          >
            {text.changeCompany}
          </button>
        </div>
      )}
      {fieldState.error?.message === undefined ? null : (
        <p className={ERROR_TEXT_CLASS}>{fieldState.error.message}</p>
      )}
    </div>
  );
};
