import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import type { AccountFilter } from "../backoffice-api";

type AccountsFilterLinkProps = {
  readonly filter: AccountFilter;
  readonly className: string;
  readonly children: ReactNode;
};

export const AccountsFilterLink = ({ filter, className, children }: AccountsFilterLinkProps) => {
  const search = useMemo(() => ({ filtre: filter }), [filter]);
  return (
    <Link to="/admin/comptes" search={search} className={className}>
      {children}
    </Link>
  );
};
