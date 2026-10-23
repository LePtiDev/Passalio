import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, type CSSProperties, type ReactNode } from "react";

export type VisitLinkMode = "select" | "open";

export const VisitLink = ({
  visitId,
  mode,
  label,
  className,
  style,
  children,
}: {
  readonly visitId: string;
  readonly mode: VisitLinkMode;
  readonly label: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children: ReactNode;
}) => {
  const search = useCallback(
    (previous: Record<string, unknown>) => ({ ...previous, passage: visitId }),
    [visitId],
  );
  const params = useMemo(() => ({ interventionId: visitId }), [visitId]);
  return mode === "select" ? (
    <Link
      from="/planning"
      to="/planning"
      search={search}
      aria-label={label}
      className={className}
      style={style}
    >
      {children}
    </Link>
  ) : (
    <Link
      to="/passages/$interventionId"
      params={params}
      aria-label={label}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
};
