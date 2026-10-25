import { Users, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { salesFr } from "../../fr";
import type { ContactListScope } from "../../sales-api";
import { EmptyFrame } from "../list/list-states";

const text = salesFr.contacts;

type ContactsEmptyProps = {
  readonly scope: ContactListScope;
  readonly onClearSearch: () => void;
  readonly onClearFilters: () => void;
};

export const ContactsEmpty = ({ scope, onClearSearch, onClearFilters }: ContactsEmptyProps) => {
  if (scope.search !== "") {
    return (
      <EmptyFrame title={text.searchEmptyTitle(scope.search)} description={text.searchEmptyText}>
        <Button variant="secondary" onClick={onClearSearch}>
          <X aria-hidden="true" />
          {salesFr.list.clearSearch}
        </Button>
      </EmptyFrame>
    );
  }
  if (scope.filter !== "all" || scope.department !== null) {
    return (
      <EmptyFrame title={text.filterEmpty} description={text.filterEmptyText}>
        <Button variant="secondary" onClick={onClearFilters}>
          {salesFr.list.showAll}
        </Button>
      </EmptyFrame>
    );
  }
  return (
    <EmptyFrame icon={Users} title={text.emptyTitle} description={text.emptyText}>
      <Link to="/admin/entreprises" className={buttonVariants()}>
        {salesFr.companies.title}
      </Link>
    </EmptyFrame>
  );
};
