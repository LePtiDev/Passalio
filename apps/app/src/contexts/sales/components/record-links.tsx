import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";

type RecordLinkProps = {
  readonly id: string;
  readonly className: string;
  readonly children: ReactNode;
};

export const CompanyLink = ({ id, className, children }: RecordLinkProps) => {
  const params = useMemo(() => ({ companyId: id }), [id]);
  return (
    <Link to="/admin/entreprises/$companyId" params={params} className={className}>
      {children}
    </Link>
  );
};

export const ContactLink = ({ id, className, children }: RecordLinkProps) => {
  const params = useMemo(() => ({ contactId: id }), [id]);
  return (
    <Link to="/admin/contacts/$contactId" params={params} className={className}>
      {children}
    </Link>
  );
};
