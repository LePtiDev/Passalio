import { Link } from "@tanstack/react-router";
import { Navigation } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { customerNameOf } from "@/contexts/customers";
import type { InterventionRecord } from "@/lib/db/local-records";
import { complianceFr } from "../../fr";
import { useNextVisit } from "../../hooks/use-next-visit";

const text = complianceFr.signed;

export const NextVisitRow = ({ current }: { readonly current: InterventionRecord }) => {
  const next = useNextVisit(current) ?? null;
  const targetId = next === null ? current.id : next.intervention.id;
  const params = useMemo(() => ({ interventionId: targetId }), [targetId]);
  if (next === null) {
    return (
      <Button asChild variant="secondary" className="self-start">
        <Link to="/passages/$interventionId" params={params}>
          {text.backToVisit}
        </Link>
      </Button>
    );
  }
  return (
    <section className="flex flex-col gap-3 border-t border-[#E3E8EF] pt-5">
      <h2 className="text-xs font-semibold tracking-wide text-[#64748B] uppercase">
        {text.nextVisit}
      </h2>
      <div className="flex items-center gap-3">
        {next.intervention.startTime === null ? null : (
          <span className="text-[17px] font-bold tabular-nums lg:text-[15px]">
            {next.intervention.startTime}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold lg:text-sm">
            {customerNameOf(next.customer)}
          </span>
          <span className="truncate text-[13px] text-[#64748B]">
            {`${next.site.address}, ${next.site.city}`}
          </span>
        </span>
        <Button asChild>
          <Link to="/passages/$interventionId" params={params}>
            <Navigation aria-hidden="true" />
            {text.goToNext}
          </Link>
        </Button>
      </div>
    </section>
  );
};
