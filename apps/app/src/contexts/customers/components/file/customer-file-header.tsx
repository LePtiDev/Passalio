import { Link } from "@tanstack/react-router";
import { CalendarDays, Mail, Navigation, Pencil, Phone, type LucideIcon } from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { MobileTopBar } from "@/components/app-shell/page-bars";
import { Button } from "@/components/ui/button";
import type { CustomerRecord, SiteRecord } from "@/lib/db/local-records";
import { fr } from "@/fr";
import { cn } from "@/lib/utils";
import { routeUrlOf } from "../../customer-view";
import { customersFr } from "../../fr";
import { NEUTRAL_BADGE_CLASS, SOON_BADGE_CLASS } from "../customer-styles";
import { MobileSyncLine } from "../sync-indicator";
import { useCustomerParams } from "../../hooks/use-route-params";
import { CustomerActionsMenu } from "./customer-actions-menu";

const text = customersFr.file;

type HeaderProps = {
  readonly customer: CustomerRecord;
  readonly name: string;
  readonly subtitle: string;
  readonly since: string;
  readonly firstSite: SiteRecord | undefined;
};

const toneOf = (customer: CustomerRecord) => (customer.kind === "company" ? "amber" : "slate");

export const CustomerFileMobileBar = ({
  customer,
  name,
}: Pick<HeaderProps, "customer" | "name">) => (
  <MobileTopBar backTo="/clients" backLabel={text.backToList}>
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-[17px] font-bold">{name}</span>
      <MobileSyncLine prefix={customersFr.kindBadge[customer.kind]} />
    </span>
    <CustomerActionsMenu
      customerId={customer.id}
      name={name}
      triggerClassName="flex size-12 shrink-0 items-center justify-center rounded-xl"
    />
  </MobileTopBar>
);

export const CustomerFileDesktopHeader = ({ customer, name, subtitle }: HeaderProps) => {
  const params = useCustomerParams(customer.id);
  return (
    <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
      <div className="flex items-center gap-3">
        <InitialsAvatar name={name} tone={toneOf(customer)} size="large" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-[-0.015em]">{name}</h1>
            <span className={NEUTRAL_BADGE_CLASS}>{customersFr.kindBadge[customer.kind]}</span>
          </div>
          <p className="text-[13px] text-[#475569]">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {customer.phone === null ? null : (
          <Button asChild variant="secondary">
            <a href={`tel:${customer.phone}`}>
              <Phone aria-hidden="true" className="size-3.5" />
              {text.call}
            </a>
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link to="/clients/$customerId/modifier" params={params}>
            <Pencil aria-hidden="true" className="size-3.5" />
            {text.edit}
          </Link>
        </Button>
        <Button variant="secondary" disabled className="text-[#94A3B8]">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {text.schedule}
          <span className={SOON_BADGE_CLASS}>{fr.shell.soon}</span>
        </Button>
        <CustomerActionsMenu
          customerId={customer.id}
          name={name}
          triggerClassName="flex size-8 items-center justify-center rounded-[7px] border border-[#E3E8EF] text-[#64748B] hover:bg-[#F7F9FB]"
        />
      </div>
    </div>
  );
};

const HeroTile = ({
  icon: Icon,
  label,
  href,
  isExternal,
}: {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly href: string | null;
  readonly isExternal?: boolean;
}) => {
  const className =
    "flex h-16 flex-col items-center justify-center gap-1 rounded-[12px] border border-[#E3E8EF] bg-white text-[13px] font-semibold";
  if (href === null) {
    return (
      <span aria-disabled="true" className={cn(className, "text-[#94A3B8]")}>
        <Icon aria-hidden="true" className="size-5" />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={className}
      {...(isExternal === true ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      <Icon aria-hidden="true" className="size-5 text-[#0E7C5A]" />
      {label}
    </a>
  );
};

export const CustomerFileMobileHero = ({ customer, name, since, firstSite }: HeaderProps) => (
  <div className="flex flex-col gap-3 lg:hidden">
    <div className="flex items-center gap-3">
      <InitialsAvatar name={name} tone={toneOf(customer)} size="large" />
      <div className="flex min-w-0 flex-col">
        <h1 className="text-xl font-bold">{name}</h1>
        <span className="text-[13px] text-[#64748B]">{since}</span>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <HeroTile
        icon={Phone}
        label={text.call}
        href={customer.phone === null ? null : `tel:${customer.phone}`}
      />
      <HeroTile
        icon={Navigation}
        label={text.route}
        href={firstSite === undefined ? null : routeUrlOf(firstSite)}
        isExternal
      />
      <HeroTile
        icon={Mail}
        label={text.email}
        href={customer.email === null ? null : `mailto:${customer.email}`}
      />
    </div>
  </div>
);
