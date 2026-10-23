import {
  BellRing,
  Building2,
  CalendarDays,
  CreditCard,
  FileCheck2,
  House,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { fr } from "@/fr";

export type NavigationItem = {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly to:
    | "/"
    | "/equipe"
    | "/reglages"
    | "/clients"
    | "/planning"
    | "/admin"
    | "/admin/comptes"
    | "/admin/journal"
    | "/admin/equipe"
    | "/admin/entreprises"
    | "/admin/contacts"
    | "/admin/prospection"
    | null;
  readonly activeFor?: readonly string[];
  readonly isExact?: boolean;
};

const text = fr.shell;

export const MAIN_NAVIGATION: readonly NavigationItem[] = [
  { label: text.dashboard, icon: LayoutDashboard, to: "/", isExact: true },
  {
    label: text.schedule,
    icon: CalendarDays,
    to: "/planning",
    activeFor: ["/planning", "/passages"],
  },
  { label: text.customers, icon: Users, to: "/clients" },
  { label: text.documents, icon: FileCheck2, to: null },
  { label: text.reminders, icon: BellRing, to: null },
];

export const SETTINGS_NAVIGATION: readonly NavigationItem[] = [
  { label: text.team, icon: UsersRound, to: "/equipe" },
  { label: text.company, icon: Building2, to: null },
  { label: text.subscription, icon: CreditCard, to: null },
];

export const MOBILE_NAVIGATION: readonly NavigationItem[] = [
  { label: text.home, icon: House, to: "/", isExact: true },
  {
    label: text.schedule,
    icon: CalendarDays,
    to: "/planning",
    activeFor: ["/planning", "/passages"],
  },
  { label: text.customers, icon: Users, to: "/clients" },
  { label: text.settings, icon: Settings, to: "/reglages", activeFor: ["/reglages", "/equipe"] },
];
