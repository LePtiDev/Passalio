import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCallback, useState, type ChangeEvent } from "react";
import {
  customerNameOf,
  describedBy,
  FIELD_CLASS,
  FormField,
  fullAddressOf,
  LINK_BUTTON_CLASS,
} from "@/contexts/customers";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { schedulingFr } from "../../fr";
import { useCustomerMatches, type ChosenCustomer } from "../../hooks/use-customer-choice";

const text = schedulingFr.form;

const FIELD_ID = "visit-customer";

type CustomerMatch = NonNullable<ReturnType<typeof useCustomerMatches>>[number];

const summaryOf = (chosen: ChosenCustomer) => {
  const site = chosen.sites[0];
  return [site === undefined ? null : fullAddressOf(site), chosen.customer.phone]
    .filter((part) => part !== null)
    .join(" · ");
};

const MatchOption = ({
  match,
  isChosen,
  onPick,
}: {
  readonly match: CustomerMatch;
  readonly isChosen: boolean;
  readonly onPick: (customerId: string) => void;
}) => {
  const pick = useCallback(() => onPick(match.customer.id), [onPick, match.customer.id]);
  return (
    <li>
      <button
        type="button"
        aria-current={isChosen ? "true" : undefined}
        onClick={pick}
        className="flex min-h-12 w-full flex-col items-start justify-center border-b border-[#EEF2F6] px-3.5 py-2 text-left hover:bg-[#F7F9FB]"
      >
        <span className="text-[15px] font-semibold lg:text-[13px]">
          {customerNameOf(match.customer)}
        </span>
        {match.site === null ? null : (
          <span className="text-[13px] text-[#64748B]">{fullAddressOf(match.site)}</span>
        )}
      </button>
    </li>
  );
};

const MatchList = ({
  query,
  matches,
  chosenId,
  onPick,
}: {
  readonly query: string;
  readonly matches: readonly CustomerMatch[] | undefined;
  readonly chosenId: string | undefined;
  readonly onPick: (customerId: string) => void;
}) => (
  <ul
    id={`${FIELD_ID}-matches`}
    aria-label={text.customerMatches}
    className="flex max-h-72 flex-col overflow-y-auto rounded-[10px] border border-[#E3E8EF] bg-white [&>li:last-child>button]:border-b-0 lg:rounded-lg"
  >
    {matches !== undefined && matches.length === 0 && query.trim() !== "" ? (
      <li className="px-3.5 py-3 text-[15px] text-[#64748B] lg:text-[13px]">
        {text.noCustomerMatch(query.trim())}
      </li>
    ) : null}
    {(matches ?? []).map((match) => (
      <MatchOption
        key={match.customer.id}
        match={match}
        isChosen={chosenId === match.customer.id}
        onPick={onPick}
      />
    ))}
  </ul>
);

export const CustomerPicker = ({
  chosen,
  error,
  onChoose,
}: {
  readonly chosen: ChosenCustomer | null;
  readonly error: string | undefined;
  readonly onChoose: (customerId: string) => void;
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const matches = useCustomerMatches(query, isSearching);
  const hint = chosen === null || isSearching ? undefined : summaryOf(chosen);
  const startSearch = useCallback(() => setIsSearching(true), []);
  const type = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setIsSearching(true);
  }, []);
  const stopSearch = useCallback(() => {
    setQuery("");
    setIsSearching(false);
  }, []);
  const pick = useCallback(
    (customerId: string) => {
      onChoose(customerId);
      stopSearch();
    },
    [onChoose, stopSearch],
  );
  return (
    <div className="flex flex-col gap-2">
      <FormField id={FIELD_ID} label={text.customer} isRequired error={error} hint={hint}>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#94A3B8] lg:left-3"
          />
          <Input
            id={FIELD_ID}
            type="search"
            aria-controls={isSearching ? `${FIELD_ID}-matches` : undefined}
            aria-required="true"
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={describedBy(FIELD_ID, error, hint)}
            autoComplete="off"
            placeholder={text.customerPlaceholder}
            value={isSearching || chosen === null ? query : customerNameOf(chosen.customer)}
            onFocus={startSearch}
            onChange={type}
            className={cn(FIELD_CLASS, "pl-10 lg:pl-9 [&::-webkit-search-cancel-button]:hidden")}
          />
          {chosen !== null && isSearching ? (
            <button
              type="button"
              aria-label={schedulingFr.visit.keep}
              onClick={stopSearch}
              className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center text-[#64748B]"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>
      </FormField>
      {isSearching ? (
        <MatchList query={query} matches={matches} chosenId={chosen?.customer.id} onPick={pick} />
      ) : null}
      <Link to="/clients/nouveau" className={cn(LINK_BUTTON_CLASS, "-mt-1 self-start")}>
        {text.newCustomer}
      </Link>
    </div>
  );
};
