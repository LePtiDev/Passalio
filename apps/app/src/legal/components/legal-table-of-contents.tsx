import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { LegalSection } from "../legal-document";
import { legalFr } from "../legal-fr";

type TableOfContentsProps = {
  readonly sections: readonly LegalSection[];
  readonly activeId: string;
};

const SectionLinks = ({ sections, activeId }: TableOfContentsProps) => (
  <ul className="flex flex-col gap-1">
    {sections.map((section) => (
      <li key={section.id}>
        <a
          href={`#${section.id}`}
          aria-current={section.id === activeId ? "location" : undefined}
          className={cn(
            "flex min-h-12 items-center rounded-lg px-2.5 text-base text-[#334155] no-underline lg:min-h-0 lg:py-1.5 lg:text-sm",
            section.id === activeId && "bg-accent font-semibold text-accent-foreground",
          )}
        >
          {section.shortTitle ?? section.title}
        </a>
      </li>
    ))}
  </ul>
);

export const DesktopTableOfContents = (props: TableOfContentsProps) => (
  <nav
    aria-label={legalFr.tableOfContents}
    className="sticky top-8 hidden max-h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col gap-2 self-start overflow-y-auto lg:flex"
  >
    <p className="text-xs font-bold tracking-[0.06em] text-muted-foreground uppercase">
      {legalFr.tableOfContents}
    </p>
    <SectionLinks {...props} />
  </nav>
);

export const MobileTableOfContents = (props: TableOfContentsProps) => (
  <Collapsible className="rounded-[10px] border border-[#D5DDE6] lg:hidden">
    <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between px-4 text-base font-semibold">
      {legalFr.tableOfContents}
      <ChevronDown
        aria-hidden="true"
        className="size-5 transition-transform group-data-[state=open]:rotate-180"
      />
    </CollapsibleTrigger>
    <CollapsibleContent className="px-1.5 pb-2">
      <nav aria-label={legalFr.tableOfContents}>
        <SectionLinks {...props} />
      </nav>
    </CollapsibleContent>
  </Collapsible>
);
