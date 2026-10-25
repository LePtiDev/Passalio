import { calendarDateOf } from "@passalio/shared";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { DesktopTopBar, MobileTopBar, PageContent } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import type { CustomerRecord, EquipmentRecord } from "@/lib/db/local-records";
import { cn } from "@/lib/utils";
import { customerNameOf, formatTimestamp } from "../../customer-view";
import { customersFr } from "../../fr";
import { useCustomerFile, type CustomerFile } from "../../hooks/use-customer-file";
import { useCustomerParams } from "../../hooks/use-route-params";
import { LINK_BUTTON_CLASS } from "../customer-styles";
import { SyncPill } from "../sync-indicator";
import { ContactCard } from "./contact-card";
import {
  CustomerFileDesktopHeader,
  CustomerFileMobileBar,
  CustomerFileMobileHero,
} from "./customer-file-header";
import { CustomerFileSkeleton } from "./customer-file-skeleton";
import { CustomerNotFound } from "./customer-not-found";
import { HistoryCard } from "./history-card";
import { SiteCard } from "./site-card";

const text = customersFr.file;

const LOADING_TRAIL = [{ label: customersFr.list.title, to: "/clients" as const }];

const NO_EQUIPMENT: readonly EquipmentRecord[] = [];

const sinceOf = (customer: CustomerRecord, today: Date) => {
  const isFeminine = customer.kind === "individual" && customer.civility === "mrs";
  return calendarDateOf(new Date(customer.createdAt)) === calendarDateOf(today)
    ? text.customerSinceToday(isFeminine)
    : text.customerSince(formatTimestamp(customer.createdAt), isFeminine);
};

const groupBySite = (equipments: readonly EquipmentRecord[]) =>
  equipments.reduce(
    (groups, equipment) =>
      groups.set(equipment.siteId, [...(groups.get(equipment.siteId) ?? []), equipment]),
    new Map<string, readonly EquipmentRecord[]>(),
  );

const CustomerFileContent = ({ file }: { readonly file: CustomerFile }) => {
  const { customer, sites, equipments, photos, today } = file;
  const name = customerNameOf(customer);
  const since = sinceOf(customer, today);
  const activeCount = equipments.filter(({ status }) => status === "active").length;
  const subtitle =
    activeCount === 0 ? since : `${since} · ${text.summary(activeCount, sites.length)}`;
  const firstSite = sites.at(0);
  const params = useCustomerParams(customer.id);
  const trail = useMemo(() => [...LOADING_TRAIL, { label: name }], [name]);
  const equipmentsBySite = useMemo(() => groupBySite(equipments), [equipments]);
  return (
    <>
      <DesktopTopBar trail={trail}>
        <SyncPill />
      </DesktopTopBar>
      <CustomerFileMobileBar customer={customer} name={name} />
      <PageContent>
        <CustomerFileDesktopHeader
          customer={customer}
          name={name}
          subtitle={subtitle}
          since={since}
          firstSite={firstSite}
        />
        <CustomerFileMobileHero
          customer={customer}
          name={name}
          subtitle={subtitle}
          since={since}
          firstSite={firstSite}
        />
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold lg:text-sm">{text.sites}</h2>
              <Link
                to="/clients/$customerId/lieux/nouveau"
                params={params}
                className={cn(LINK_BUTTON_CLASS, "hidden lg:inline-flex")}
              >
                <Plus aria-hidden="true" className="size-3.5" />
                {text.addSite}
              </Link>
            </div>
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                equipments={equipmentsBySite.get(site.id) ?? NO_EQUIPMENT}
                allEquipments={equipments}
                photos={photos}
                today={today}
              />
            ))}
            <Button asChild variant="secondary" className="lg:hidden">
              <Link to="/clients/$customerId/lieux/nouveau" params={params}>
                <Plus aria-hidden="true" className="size-4" />
                {text.addSite}
              </Link>
            </Button>
            <div className="hidden lg:block">
              <HistoryCard items={file.certificates} />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <ContactCard customer={customer} firstSite={firstSite} />
            <div className="lg:hidden">
              <HistoryCard items={file.certificates} />
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
};

export const CustomerFileScreen = ({ customerId }: { readonly customerId: string }) => {
  const file = useCustomerFile(customerId);
  if (file === undefined) {
    return (
      <>
        <DesktopTopBar trail={LOADING_TRAIL} />
        <MobileTopBar backTo="/clients" backLabel={text.backToList}>
          <span className="flex-1" />
        </MobileTopBar>
        <PageContent>
          <CustomerFileSkeleton />
        </PageContent>
      </>
    );
  }
  return file === null ? <CustomerNotFound /> : <CustomerFileContent file={file} />;
};
