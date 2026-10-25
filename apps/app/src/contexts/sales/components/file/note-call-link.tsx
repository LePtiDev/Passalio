import { Link } from "@tanstack/react-router";
import { NotebookPen } from "lucide-react";
import { useMemo } from "react";
import { salesFr } from "../../fr";

export const NoteCallLink = ({
  companyId,
  className,
}: {
  readonly companyId: string;
  readonly className: string;
}) => {
  const search = useMemo(() => ({ entreprise: companyId }), [companyId]);
  return (
    <Link to="/admin/appels/serie" search={search} className={className}>
      <NotebookPen aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
      {salesFr.file.noteCall}
    </Link>
  );
};
