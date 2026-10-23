import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fr } from "@/fr";
import type { ApiError } from "@/lib/api-client";
import { errorCodeLine } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { customersFr } from "../../fr";
import {
  CARD_CLASS,
  CUSTOMER_GRID_CLASS,
  DASHED_CARD_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  SOON_BADGE_CLASS,
} from "../customer-styles";
import { CustomerListHeader } from "./customer-row";

const text = customersFr.list;

const PLACEHOLDER_ROWS = ["a", "b", "c", "d", "e", "f"];

export const CustomerListSkeleton = () => (
  <div className={CARD_CLASS} aria-busy="true" aria-label={text.loading}>
    <CustomerListHeader />
    <ul>
      {PLACEHOLDER_ROWS.map((key) => (
        <li
          key={key}
          className={cn(
            CUSTOMER_GRID_CLASS,
            "min-h-[72px] border-b border-[#EEF2F6] py-3 pr-3 pl-3.5 last:border-b-0 lg:min-h-[56px]",
          )}
        >
          <span className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-full lg:size-7" />
            <span className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-44" />
            </span>
          </span>
          <span className="hidden flex-col gap-1.5 lg:flex">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-32" />
          </span>
          <Skeleton className="hidden h-5 w-24 lg:block" />
          <span className="flex justify-end lg:justify-start">
            <Skeleton className="h-5 w-20" />
          </span>
          <span />
        </li>
      ))}
    </ul>
  </div>
);

const NewCustomerLink = ({ label, name }: { readonly label: string; readonly name?: string }) => {
  const search = useMemo(() => (name === undefined ? {} : { nom: name }), [name]);
  return (
    <Button asChild className={cn(PRIMARY_BUTTON_CLASS, "lg:px-3")}>
      <Link to="/clients/nouveau" search={search}>
        <Plus aria-hidden="true" className="size-4 lg:size-3.5" strokeWidth={2.2} />
        {label}
      </Link>
    </Button>
  );
};

export const CustomerListEmpty = () => (
  <div className={DASHED_CARD_CLASS}>
    <span className="flex size-11 items-center justify-center rounded-full bg-[#E6F4EE] text-[#0E7C5A]">
      <Users aria-hidden="true" className="size-5" />
    </span>
    <span className="flex flex-col gap-1">
      <h2 className="text-[17px] font-bold lg:text-[15px]">{text.emptyTitle}</h2>
      <p className="text-[15px] text-[#475569] lg:text-[13px]">{text.emptyText}</p>
    </span>
    <span className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
      <NewCustomerLink label={text.newCustomer} />
      <Button variant="outline" disabled className={cn(SECONDARY_BUTTON_CLASS, "text-[#94A3B8]")}>
        <Upload aria-hidden="true" className="size-4 lg:size-3.5" />
        {text.import}
        <span className={SOON_BADGE_CLASS}>{fr.shell.soon}</span>
      </Button>
    </span>
  </div>
);

export const CustomerSearchEmpty = ({
  query,
  onClear,
}: {
  readonly query: string;
  readonly onClear: () => void;
}) => (
  <div className={DASHED_CARD_CLASS}>
    <span className="flex flex-col gap-1">
      <h2 className="text-[17px] font-bold lg:text-[15px]">{text.searchEmptyTitle(query)}</h2>
      <p className="text-[15px] text-[#475569] lg:text-[13px]">{text.searchEmptyText}</p>
    </span>
    <span className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row">
      <NewCustomerLink label={text.createFromSearch(query)} name={query} />
      <Button variant="outline" className={SECONDARY_BUTTON_CLASS} onClick={onClear}>
        {text.clearSearch}
      </Button>
    </span>
  </div>
);

export const CustomerListError = ({
  error,
  onRetry,
}: {
  readonly error: ApiError | null;
  readonly onRetry: () => void;
}) => {
  const codeLine = error === null ? undefined : errorCodeLine(error);
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-1 rounded-[14px] border border-[#E3E8EF] bg-white p-4 lg:rounded-xl"
    >
      <span className="text-[15px] font-semibold lg:text-sm">{text.loadError}</span>
      {codeLine === undefined ? null : (
        <span className="text-xs text-[#64748B] tabular-nums">{codeLine}</span>
      )}
      <Button
        variant="outline"
        className={cn(SECONDARY_BUTTON_CLASS, "mt-2 px-4")}
        onClick={onRetry}
      >
        {fr.errors.retry}
      </Button>
    </div>
  );
};
