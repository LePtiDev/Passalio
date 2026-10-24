import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";

export const NewVisitLink = ({
  day,
  className,
  label,
  children,
}: {
  readonly day: string;
  readonly className?: string;
  readonly label?: string;
  readonly children: ReactNode;
}) => {
  const search = useMemo(() => ({ jour: day }), [day]);
  return (
    <Link to="/planning/nouveau" search={search} aria-label={label} className={className}>
      {children}
    </Link>
  );
};
