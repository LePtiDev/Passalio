import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { LEGAL_PATHS } from "../legal-document";
import { legalFr } from "../legal-fr";

const LINKS = [
  { to: LEGAL_PATHS.terms, label: legalFr.links.terms },
  { to: LEGAL_PATHS.privacy, label: legalFr.links.privacy },
  { to: LEGAL_PATHS.legalNotice, label: legalFr.links.legalNotice },
] as const;

export const LegalLinks = ({ className }: { readonly className?: string }) => (
  <nav aria-label={legalFr.documentsNavigation} className={cn("flex flex-wrap", className)}>
    {LINKS.map(({ to, label }) => (
      <Link
        key={to}
        to={to}
        className="inline-flex min-h-8 items-center px-1.5 underline-offset-2 hover:underline"
      >
        {label}
      </Link>
    ))}
  </nav>
);

export const LegalDocumentTabs = () => (
  <nav aria-label={legalFr.documentsNavigation} className="flex flex-wrap gap-2">
    {LINKS.map(({ to, label }) => (
      <Link
        key={to}
        to={to}
        className="inline-flex min-h-10 items-center rounded-full bg-muted px-3.5 text-sm font-semibold text-foreground lg:min-h-8 lg:px-3 lg:text-[13px] data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
      >
        {label}
      </Link>
    ))}
  </nav>
);
