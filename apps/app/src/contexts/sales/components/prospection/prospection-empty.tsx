import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { EmptyFrame } from "../list/list-states";
import { SheetFrame } from "./lead-sheet";
import type { ProspectionScope } from "./prospection-scope";

const text = salesFr.prospection;

type ProspectionEmptyProps = {
  readonly scope: ProspectionScope;
  readonly onClearSearch: () => void;
  readonly onClearDepartment: () => void;
};

const EmptyAction = ({ scope, onClearSearch, onClearDepartment }: ProspectionEmptyProps) => {
  if (scope.search !== "") {
    return (
      <Button variant="secondary" onClick={onClearSearch}>
        {salesFr.list.clearSearch}
      </Button>
    );
  }
  if (scope.department !== null) {
    return (
      <Button variant="secondary" onClick={onClearDepartment}>
        {salesFr.list.anyDepartment}
      </Button>
    );
  }
  return (
    <Link
      to="/admin/entreprises"
      className={cn("inline-flex items-center rounded-[10px] border border-[#E3E8EF] px-4 lg:px-3")}
    >
      {text.seeCompanies}
    </Link>
  );
};

const titleOf = (scope: ProspectionScope) =>
  scope.search === "" ? text.emptyTitle(scope.tab) : text.searchEmptyTitle(scope.search);

const descriptionOf = (scope: ProspectionScope) =>
  scope.search === "" ? text.emptyText : text.searchEmptyText;

export const ProspectionEmpty = (props: ProspectionEmptyProps) => (
  <div className="self-start">
    <EmptyFrame title={titleOf(props.scope)} description={descriptionOf(props.scope)}>
      <EmptyAction {...props} />
    </EmptyFrame>
  </div>
);

export const ProspectionSheetEmpty = (props: ProspectionEmptyProps) => (
  <SheetFrame>
    <div className="flex flex-col gap-1">
      <strong className="text-[17px] font-bold">{titleOf(props.scope)}</strong>
      <span className="text-[13px] text-[#64748B]">{descriptionOf(props.scope)}</span>
    </div>
    <EmptyAction {...props} />
  </SheetFrame>
);
