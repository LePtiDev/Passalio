import { Search } from "lucide-react";
import { useCallback, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorOf } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useCompanySearch } from "../../hooks/use-company-search";
import type { CompanySummary } from "../../identity-api";
import { onboardingFr } from "../../onboarding-fr";
import { AUTH_FIELD_CLASS, AUTH_LABEL_CLASS } from "../auth-styles";
import { formatSiret, toDisplayName } from "./display-name";

const text = onboardingFr.company;

type CompanySearchProps = {
  readonly onSelect: (company: CompanySummary) => void;
  readonly onManualEntry: () => void;
};

const CompanyOption = ({
  company,
  onSelect,
}: {
  readonly company: CompanySummary;
  readonly onSelect: (company: CompanySummary) => void;
}) => {
  const select = useCallback(() => onSelect(company), [company, onSelect]);
  return (
    <li className="border-t border-[#EEF2F6] first:border-t-0">
      <button
        type="button"
        onClick={select}
        className="flex min-h-12 w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-[#F1F7F4] focus-visible:bg-[#F1F7F4] focus-visible:outline-none"
      >
        <strong className="text-sm font-bold lg:text-[13px]">{company.name}</strong>
        <span className="text-[13px] text-muted-foreground tabular-nums lg:text-xs">
          {text.siretLine(
            formatSiret(company.siret),
            `${company.postalCode} ${toDisplayName(company.city)}`,
          )}
        </span>
      </button>
    </li>
  );
};

const SearchResults = ({
  query,
  onSelect,
}: { readonly query: string } & Pick<CompanySearchProps, "onSelect">) => {
  const { data, isFetching, isError, error } = useCompanySearch(query);
  if (query.trim().length < 3) {
    return null;
  }
  if (isError) {
    const codeLine = errorCodeLine(apiErrorOf(error));
    return (
      <p className="flex flex-col gap-0.5 text-sm text-muted-foreground lg:text-[13px]">
        <span>{text.searchUnavailable}</span>
        {codeLine === undefined ? null : <span className="tabular-nums">{codeLine}</span>}
      </p>
    );
  }
  if (data === undefined || isFetching) {
    return (
      <div
        aria-label={text.searching}
        className="flex flex-col gap-2 rounded-lg border border-[#E3E8EF] p-3"
      >
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    );
  }
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground lg:text-[13px]">{text.noResult}</p>;
  }
  return (
    <ul className="overflow-hidden rounded-lg border border-[#E3E8EF] bg-white shadow-[0_12px_24px_-12px_rgba(15,42,68,0.2)]">
      {data.map((company) => (
        <CompanyOption key={company.siret} company={company} onSelect={onSelect} />
      ))}
    </ul>
  );
};

export const CompanySearch = ({ onSelect, onManualEntry }: CompanySearchProps) => {
  const [query, setQuery] = useState("");
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
    [],
  );
  const select = useCallback(
    (company: CompanySummary) => {
      setQuery("");
      onSelect(company);
    },
    [onSelect],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="company-search" className={AUTH_LABEL_CLASS}>
        {text.searchLabel}
      </Label>
      <div className="relative flex items-center">
        <Search aria-hidden="true" className="absolute left-3 size-4 text-[#64748B]" />
        <Input
          id="company-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={onChange}
          placeholder={text.searchPlaceholder}
          className={cn(AUTH_FIELD_CLASS, "pl-9 lg:pl-9")}
        />
      </div>
      <SearchResults query={query} onSelect={select} />
      <span className="text-[13px] text-[#64748B] lg:text-xs">
        {text.searchHint}{" "}
        <button
          type="button"
          onClick={onManualEntry}
          className="font-semibold text-success hover:text-[#0B6349]"
        >
          {text.manualEntry}
        </button>
      </span>
    </div>
  );
};
