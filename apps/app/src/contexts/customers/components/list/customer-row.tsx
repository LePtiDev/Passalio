import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { cn } from "@/lib/utils";
import { formatCalendarDate } from "../../customer-view";
import { customersFr } from "../../fr";
import type { CustomerListRow } from "../../hooks/use-customer-list";
import { CUSTOMER_GRID_CLASS, NEUTRAL_BADGE_CLASS } from "../customer-styles";
import { DueDate } from "../due-date";
import { useCustomerParams } from "../../hooks/use-route-params";

const text = customersFr.list;

const MAX_EQUIPMENT_BADGES = 2;

const equipmentLabels = ({ equipments }: CustomerListRow): readonly string[] => {
  if (equipments.length === 0) {
    return [text.noEquipment];
  }
  return equipments.length > MAX_EQUIPMENT_BADGES
    ? [text.equipmentCount(equipments.length)]
    : equipments.map(({ kind, energy }) => customersFr.equipmentName(kind, energy));
};

const contactLine = ({ customer }: CustomerListRow) => {
  if (customer.kind === "company" && customer.lastName !== null) {
    return text.contact(customer.lastName, customer.phone);
  }
  return customer.phone ?? customer.email ?? "";
};

export const CustomerRow = ({ row }: { readonly row: CustomerListRow }) => {
  const params = useCustomerParams(row.customer.id);
  const { name } = row;
  const labels = equipmentLabels(row);
  const city = row.site?.city ?? "";
  return (
    <li className="border-b border-[#EEF2F6] last:border-b-0">
      <Link
        to="/clients/$customerId"
        params={params}
        className={cn(
          CUSTOMER_GRID_CLASS,
          "min-h-[72px] py-2.5 pr-3 pl-3.5 hover:bg-[#F7F9FB] lg:min-h-0 lg:pr-3.5",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <InitialsAvatar
            name={name}
            tone={row.customer.kind === "company" ? "amber" : "slate"}
            size="medium"
          />
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-[15px] font-semibold lg:text-[13px]">
              {name}
              {row.isPending ? (
                <span className="ml-1.5 rounded-full bg-[#FEF3E2] px-1.5 py-px align-middle text-[10px] font-semibold text-[#B45309]">
                  {customersFr.sync.pendingBadge}
                </span>
              ) : null}
            </span>
            <span className="truncate text-[13px] text-[#64748B] lg:hidden">
              {[city, labels.join(", ")].filter((part) => part !== "").join(" · ")}
            </span>
            <span className="hidden truncate text-[13px] text-[#64748B] lg:block">
              {contactLine(row)}
            </span>
          </span>
        </span>
        <span className="hidden min-w-0 flex-col gap-px lg:flex">
          <span className="truncate text-[13px]">{row.site?.address ?? ""}</span>
          <span className="truncate text-[13px] text-[#64748B]">
            {row.site === null ? "" : `${row.site.postalCode} ${row.site.city}`}
          </span>
        </span>
        <span className="hidden min-w-0 flex-wrap gap-1 lg:flex">
          {labels.map((label) => (
            <span key={label} className={NEUTRAL_BADGE_CLASS}>
              {label}
            </span>
          ))}
        </span>
        <span className="flex justify-end lg:justify-start">
          <DueDate
            status={row.dueStatus}
            label={row.nextDue === null ? text.dueUnknown : formatCalendarDate(row.nextDue)}
            desktopPrefix={row.dueStatus === "overdue" ? text.overdue : undefined}
          />
        </span>
        <ChevronRight aria-hidden="true" className="hidden size-4 text-[#94A3B8] lg:block" />
      </Link>
    </li>
  );
};

export const CustomerListHeader = () => (
  <div
    className={cn(
      CUSTOMER_GRID_CLASS,
      "hidden border-b border-[#E3E8EF] bg-[#F7F9FB] px-3.5 py-2.5 text-[13px] font-semibold text-[#64748B] lg:grid",
    )}
  >
    <span>{text.columns.customer}</span>
    <span>{text.columns.address}</span>
    <span>{text.columns.equipments}</span>
    <span>{text.columns.nextDue}</span>
    <span />
  </div>
);
