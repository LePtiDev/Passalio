import { Building2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_PRIMARY_BUTTON_CLASS, ADMIN_SECONDARY_BUTTON_CLASS } from "@/contexts/backoffice";
import { salesFr } from "../../fr";
import type { CompanyListScope } from "../../sales-api";
import { EmptyFrame } from "../list/list-states";

const text = salesFr.companies;

type CompaniesEmptyProps = {
  readonly scope: CompanyListScope;
  readonly onClearSearch: () => void;
  readonly onClearFilters: () => void;
  readonly onCreate: () => void;
};

export const CompaniesEmpty = ({
  scope,
  onClearSearch,
  onClearFilters,
  onCreate,
}: CompaniesEmptyProps) => {
  if (scope.search !== "") {
    return (
      <EmptyFrame title={text.searchEmptyTitle(scope.search)} description={text.searchEmptyText}>
        <Button variant="outline" className={ADMIN_SECONDARY_BUTTON_CLASS} onClick={onClearSearch}>
          <X aria-hidden="true" />
          {salesFr.list.clearSearch}
        </Button>
      </EmptyFrame>
    );
  }
  if (scope.stage !== null || scope.department !== null || scope.owner !== null) {
    return (
      <EmptyFrame
        title={
          scope.stage === null ? text.filterEmpty : text.stageEmpty(salesFr.stages[scope.stage])
        }
        description={text.stageEmptyText}
      >
        <Button variant="outline" className={ADMIN_SECONDARY_BUTTON_CLASS} onClick={onClearFilters}>
          {salesFr.list.showAll}
        </Button>
      </EmptyFrame>
    );
  }
  return (
    <EmptyFrame icon={Building2} title={text.emptyTitle} description={text.emptyText}>
      <Button className={ADMIN_PRIMARY_BUTTON_CLASS} onClick={onCreate}>
        <Plus aria-hidden="true" strokeWidth={2.2} />
        {text.create}
      </Button>
    </EmptyFrame>
  );
};
