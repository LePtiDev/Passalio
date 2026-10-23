import type { ProspectCompanyResponse, ProspectStage } from "@passalio/shared";
import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import { ADMIN_CARD_CLASS } from "@/contexts/backoffice";
import { cn } from "@/lib/utils";
import { salesFr } from "../../fr";
import { MAP_CANVAS_CLASS, useLeafletMap } from "../map/use-leaflet-map";
import { usePlacePin } from "../map/use-place-pin";
import { townOf } from "./company-facts";

const text = salesFr.prospection;

type PlaceMapProps = {
  readonly latitude: number;
  readonly longitude: number;
  readonly stage: ProspectStage;
};

const PlaceMap = ({ latitude, longitude, stage }: PlaceMapProps) => {
  const { containerRef, map } = useLeafletMap(false);
  usePlacePin({ map, latitude, longitude, stage });
  return (
    <div aria-hidden="true" className="relative h-[150px] bg-[#EDF0EA]">
      <div ref={containerRef} className={MAP_CANVAS_CLASS} />
    </div>
  );
};

export const ProspectionLink = ({
  company,
  className,
  children,
}: {
  readonly company: ProspectCompanyResponse;
  readonly className: string;
  readonly children: ReactNode;
}) => {
  const search = useMemo(
    () => ({ departement: company.department, entreprise: company.id }),
    [company.department, company.id],
  );
  return (
    <Link to="/admin/prospection" search={search} className={className}>
      {children}
    </Link>
  );
};

export const CompanyMapCard = ({ company }: { readonly company: ProspectCompanyResponse }) => {
  const town = townOf({ company });
  return (
    <section className={ADMIN_CARD_CLASS}>
      {company.latitude === null || company.longitude === null ? null : (
        <PlaceMap latitude={company.latitude} longitude={company.longitude} stage={company.stage} />
      )}
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]",
          company.latitude !== null && "border-t border-[#EEF2F6]",
        )}
      >
        <span className="flex min-w-0 flex-col">
          {company.address === null ? null : <span className="truncate">{company.address}</span>}
          <span className="truncate text-[#475569]">{town}</span>
        </span>
        <ProspectionLink
          company={company}
          className="shrink-0 font-semibold text-[#0E7C5A] hover:text-[#0F2A44]"
        >
          {text.seeOnMap}
        </ProspectionLink>
      </div>
    </section>
  );
};
