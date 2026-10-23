import { Briefcase, Building2, LayoutGrid, List, MapPin, Users } from "lucide-react";
import type { NavigationItem } from "@/components/app-shell/navigation";
import { backofficeFr } from "../../fr";

const text = backofficeFr.shell;

export const COMMERCIAL_NAVIGATION: readonly NavigationItem[] = [
  { label: text.companies, icon: Building2, to: "/admin/entreprises" },
  { label: text.contacts, icon: Users, to: "/admin/contacts" },
  { label: text.prospection, icon: MapPin, to: null },
];

export const PLATFORM_NAVIGATION: readonly NavigationItem[] = [
  { label: text.overview, icon: LayoutGrid, to: "/admin", isExact: true },
  { label: text.accounts, icon: Briefcase, to: "/admin/comptes" },
  { label: text.journal, icon: List, to: "/admin/journal" },
];

export const ADMIN_MOBILE_NAVIGATION: readonly NavigationItem[] = [
  {
    label: text.commercial,
    icon: Building2,
    to: "/admin/entreprises",
    activeFor: ["/admin/entreprises", "/admin/contacts"],
  },
  { label: text.overviewShort, icon: LayoutGrid, to: "/admin", isExact: true },
  { label: text.accountsShort, icon: Briefcase, to: "/admin/comptes" },
  { label: text.journal, icon: List, to: "/admin/journal" },
];

export const SALES_MOBILE_NAVIGATION: readonly NavigationItem[] = COMMERCIAL_NAVIGATION;
