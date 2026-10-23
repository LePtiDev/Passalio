import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import logo from "@/assets/passalio-logo.svg";
import { fr } from "@/fr";
import type { LegalDocument } from "../legal-document";
import { legalFr } from "../legal-fr";
import { LegalBlockView } from "./legal-block-view";
import { LegalDocumentTabs, LegalLinks } from "./legal-links";
import { DesktopTableOfContents, MobileTableOfContents } from "./legal-table-of-contents";
import { useActiveSection } from "./use-active-section";

const LegalHeader = () => (
  <header className="flex h-14 items-center justify-between border-b border-border pr-2 pl-4 lg:h-16 lg:px-10">
    <img src={logo} alt={fr.app.name} width={121} height={24} className="h-5 w-auto lg:h-6" />
    <Link
      to="/"
      className="inline-flex min-h-12 items-center gap-1.5 px-2 text-[15px] font-semibold text-success no-underline lg:min-h-10 lg:text-sm"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      <span className="lg:hidden">{legalFr.back}</span>
      <span className="hidden lg:inline">{legalFr.backToApp}</span>
    </Link>
  </header>
);

const LegalFooter = () => (
  <footer className="flex flex-col items-center gap-2 border-t border-border px-4 py-4 text-[13px] text-muted-foreground lg:h-16 lg:flex-row lg:justify-between lg:px-10 lg:py-0">
    <span>{legalFr.copyright}</span>
    <LegalLinks className="gap-3" />
  </footer>
);

export const LegalPage = ({ content }: { readonly content: LegalDocument }) => {
  const sectionIds = useMemo(() => content.sections.map(({ id }) => id), [content]);
  const activeId = useActiveSection(sectionIds);
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <LegalHeader />
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 gap-16 px-4 pt-5 pb-12 lg:px-10 lg:pt-12">
        <DesktopTableOfContents sections={content.sections} activeId={activeId} />
        <main className="flex max-w-[720px] min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-[26px] leading-tight font-extrabold tracking-tight lg:text-[34px]">
              {content.title}
            </h1>
            <p className="text-sm text-muted-foreground">{legalFr.version}</p>
            <LegalDocumentTabs />
          </div>
          <MobileTableOfContents sections={content.sections} activeId={activeId} />
          {content.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              className="flex scroll-mt-6 flex-col gap-2.5"
            >
              <h2 id={`${section.id}-title`} className="text-[19px] font-bold lg:text-xl">
                {section.title}
              </h2>
              {section.blocks.map((block, index) => (
                <LegalBlockView key={`${section.id}-${String(index)}`} block={block} />
              ))}
            </section>
          ))}
        </main>
      </div>
      <LegalFooter />
    </div>
  );
};
