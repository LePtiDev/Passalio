import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";

type AccountLinkProps = {
  readonly accountId: string;
  readonly className: string;
  readonly children: ReactNode;
};

export const AccountLink = ({ accountId, className, children }: AccountLinkProps) => {
  const params = useMemo(() => ({ accountId }), [accountId]);
  return (
    <Link to="/admin/comptes/$accountId" params={params} className={className}>
      {children}
    </Link>
  );
};
