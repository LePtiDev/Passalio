import {
  Briefcase,
  Building2,
  House,
  LayoutGrid,
  List,
  MapPin,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { NavigationItem } from "@/components/app-shell/navigation";
import { backofficeFr } from "../../fr";
import { settingsFr } from "../../settings-fr";
import { teamFr } from "../../team-fr";

const text = backofficeFr.shell;

export const COMMERCIAL_NAVIGATION: readonly NavigationItem[] = [
  { label: text.myDay, icon: House, to: "/admin/journee" },
  { label: text.calls, icon: Phone, to: "/admin/appels" },
  { label: text.companies, icon: Building2, to: "/admin/entreprises" },
  { label: text.contacts, icon: Users, to: "/admin/contacts" },
  { label: text.prospection, icon: MapPin, to: "/admin/prospection" },
];

export const PLATFORM_NAVIGATION: readonly NavigationItem[] = [
  { label: text.overview, icon: LayoutGrid, to: "/admin", isExact: true },
  { label: text.accounts, icon: Briefcase, to: "/admin/comptes" },
  { label: text.journal, icon: List, to: "/admin/journal" },
];

const TEAM_NAVIGATION: NavigationItem = {
  label: teamFr.navigation,
  icon: ShieldCheck,
  to: "/admin/equipe",
};

const SETTINGS_NAVIGATION: NavigationItem = {
  label: settingsFr.navigation,
  icon: SlidersHorizontal,
  to: "/admin/reglages",
};

export const SUPERADMIN_PLATFORM_NAVIGATION: readonly NavigationItem[] = [
  ...PLATFORM_NAVIGATION,
  TEAM_NAVIGATION,
  SETTINGS_NAVIGATION,
];

export const ADMIN_MOBILE_NAVIGATION: readonly NavigationItem[] = [
  {
    label: text.commercial,
    icon: Building2,
    to: "/admin/entreprises",
    activeFor: [
      "/admin/entreprises",
      "/admin/contacts",
      "/admin/prospection",
      "/admin/journee",
      "/admin/appels",
    ],
  },
  { label: text.overviewShort, icon: LayoutGrid, to: "/admin", isExact: true },
  { label: text.accountsShort, icon: Briefcase, to: "/admin/comptes" },
  { label: text.journal, icon: List, to: "/admin/journal" },
];

export const SALES_MOBILE_NAVIGATION: readonly NavigationItem[] = COMMERCIAL_NAVIGATION;

export const SUPERADMIN_MOBILE_NAVIGATION: readonly NavigationItem[] = [
  ...ADMIN_MOBILE_NAVIGATION,
  { ...TEAM_NAVIGATION, label: teamFr.navigationShort },
];
