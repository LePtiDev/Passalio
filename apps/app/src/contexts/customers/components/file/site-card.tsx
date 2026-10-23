import { Link } from "@tanstack/react-router";
import {
  Building2,
  Ellipsis,
  History,
  House,
  KeyRound,
  Navigation,
  Plus,
  Store,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EquipmentRecord, PhotoRecord, SiteRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { fullAddressOf, routeUrlOf } from "../../customer-view";
import { BUILDING_TYPE_LABELS, customersFr } from "../../fr";
import {
  CARD_CLASS,
  ICON_BUTTON_CLASS,
  LINK_BUTTON_CLASS,
  NEUTRAL_BADGE_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../customer-styles";
import { useCustomerParams, useSiteSearch } from "../../hooks/use-route-params";
import { EquipmentRow } from "./equipment-row";

const text = customersFr.file;

const BUILDING_ICONS = { house: House, apartment: Building2, business: Store } as const;

type SiteCardProps = {
  readonly site: SiteRecord;
  readonly equipments: readonly EquipmentRecord[];
  readonly allEquipments: readonly EquipmentRecord[];
  readonly photos: readonly PhotoRecord[];
  readonly today: Date;
};

const replacementKindOf = (equipment: EquipmentRecord, allEquipments: readonly EquipmentRecord[]) =>
  allEquipments.find(({ id }) => id === equipment.replacedByEquipmentId)?.kind ?? null;

const NoEquipment = ({ site }: { readonly site: SiteRecord }) => {
  const params = useCustomerParams(site.customerId);
  const search = useSiteSearch(site.id);
  return (
    <div className="flex flex-col items-start gap-1 border-t border-dashed border-[#D5DDE6] bg-[#FBFCFD] px-3.5 py-4">
      <span className="text-[15px] font-semibold lg:text-[13px]">{text.noEquipmentTitle}</span>
      <span className="text-[13px] text-[#475569]">{text.noEquipmentText}</span>
      <Button asChild className={cn(PRIMARY_BUTTON_CLASS, "mt-2 w-full px-4 lg:w-auto")}>
        <Link to="/clients/$customerId/appareils/nouveau" params={params} search={search}>
          <Plus aria-hidden="true" className="size-4 lg:size-3.5" />
          {text.addEquipment}
        </Link>
      </Button>
    </div>
  );
};

const SiteMenu = ({ site }: { readonly site: SiteRecord }) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label={text.siteActions}
      className={cn(ICON_BUTTON_CLASS, "-my-2.5 -mr-2 lg:hidden")}
    >
      <Ellipsis aria-hidden="true" className="size-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem asChild className="min-h-12">
        <a href={routeUrlOf(site)} target="_blank" rel="noreferrer">
          <Navigation aria-hidden="true" className="size-4" />
          {text.route}
        </a>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const SiteHeader = ({ site }: { readonly site: SiteRecord }) => {
  const Icon = BUILDING_ICONS[site.buildingType];
  const typeLabel = BUILDING_TYPE_LABELS[site.buildingType];
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF3F8] lg:size-8">
        <Icon aria-hidden="true" className="size-[18px] lg:size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-semibold lg:text-[13px]">{site.label ?? typeLabel}</h3>
          <span className={NEUTRAL_BADGE_CLASS}>{typeLabel}</span>
        </div>
        <span className="text-[15px] lg:text-[13px]">{fullAddressOf(site)}</span>
        {site.addressDetails === null ? null : (
          <span className="text-[13px] text-[#64748B]">{site.addressDetails}</span>
        )}
        {site.occupantName === null ? null : (
          <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-[#475569]">
            <User aria-hidden="true" className="size-3.5 shrink-0 text-[#94A3B8]" />
            {text.occupant(
              [site.occupantName, site.occupantPhone].filter((part) => part !== null).join(" · "),
            )}
          </span>
        )}
        {site.accessNotes === null ? null : (
          <span className="inline-flex items-start gap-1.5 text-[13px] text-[#475569]">
            <KeyRound aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[#94A3B8]" />
            {site.accessNotes}
          </span>
        )}
      </div>
      <SiteMenu site={site} />
      <Button
        asChild
        variant="outline"
        className={cn(SECONDARY_BUTTON_CLASS, "hidden lg:inline-flex")}
      >
        <a href={routeUrlOf(site)} target="_blank" rel="noreferrer">
          <Navigation aria-hidden="true" className="size-3.5" />
          {text.route}
        </a>
      </Button>
    </div>
  );
};

export const SiteCard = ({ site, equipments, allEquipments, photos, today }: SiteCardProps) => {
  const params = useCustomerParams(site.customerId);
  const search = useSiteSearch(site.id);
  const active = equipments.filter(({ status }) => status === "active");
  const removed = equipments.filter(({ status }) => status === "removed");
  const photoOf = (equipmentId: string) =>
    photos.find((photo) => photo.equipmentId === equipmentId && photo.kind === "overview") ??
    photos.find((photo) => photo.equipmentId === equipmentId);
  return (
    <section className={CARD_CLASS}>
      <SiteHeader site={site} />
      {active.length === 0 && removed.length === 0 ? <NoEquipment site={site} /> : null}
      {active.length === 0 ? null : (
        <ul>
          {active.map((equipment) => (
            <EquipmentRow
              key={equipment.id}
              equipment={equipment}
              customerId={site.customerId}
              photo={photoOf(equipment.id)}
              replacementKind={null}
              today={today}
            />
          ))}
        </ul>
      )}
      {removed.length === 0 ? null : (
        <Collapsible defaultOpen className="border-t border-[#EEF2F6]">
          <CollapsibleTrigger className="flex min-h-12 w-full items-center gap-2 px-3.5 text-[13px] font-semibold text-[#64748B] lg:min-h-10">
            <History aria-hidden="true" className="size-4" />
            {text.removedEquipments(removed.length)}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul>
              {removed.map((equipment) => (
                <EquipmentRow
                  key={equipment.id}
                  equipment={equipment}
                  customerId={site.customerId}
                  photo={undefined}
                  replacementKind={replacementKindOf(equipment, allEquipments)}
                  today={today}
                />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
      {active.length === 0 && removed.length === 0 ? null : (
        <div className="border-t border-[#EEF2F6] px-3.5">
          <Link
            to="/clients/$customerId/appareils/nouveau"
            params={params}
            search={search}
            className={LINK_BUTTON_CLASS}
          >
            <Plus aria-hidden="true" className="size-4 lg:size-3.5" />
            {text.addEquipment}
          </Link>
        </div>
      )}
    </section>
  );
};
