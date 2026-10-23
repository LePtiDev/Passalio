import { Link } from "@tanstack/react-router";
import { fr } from "@/fr";
import type { NavigationItem } from "./navigation";

const LINK_CLASS =
  "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-[#334155] hover:bg-[#EEF3F8] data-[status=active]:bg-white data-[status=active]:font-semibold data-[status=active]:text-[#0F2A44] data-[status=active]:shadow-[0_0_0_1px_#E3E8EF,0_1px_2px_rgba(15,42,68,0.06)]";

const ICON_CLASS = "size-[15px] text-[#94A3B8] group-data-[status=active]:text-[#0E7C5A]";

const EXACT = { exact: true } as const;

const PREFIX = { exact: false } as const;

export const SidebarLink = ({ item }: { readonly item: NavigationItem }) => {
  const Icon = item.icon;
  if (item.to === null) {
    return (
      <span
        aria-disabled="true"
        className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-[#94A3B8]"
      >
        <Icon aria-hidden="true" className="size-[15px]" strokeWidth={1.8} />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-full bg-[#EEF3F8] px-1.5 py-px text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
          {fr.shell.soon}
        </span>
      </span>
    );
  }
  return (
    <Link to={item.to} activeOptions={item.to === "/" ? EXACT : PREFIX} className={LINK_CLASS}>
      <Icon aria-hidden="true" className={ICON_CLASS} strokeWidth={1.8} />
      {item.label}
    </Link>
  );
};
