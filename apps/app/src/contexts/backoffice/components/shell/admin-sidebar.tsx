import { Link } from "@tanstack/react-router";
import { Settings, UserRound } from "lucide-react";
import logo from "@/assets/passalio-logo.svg";
import { AccountMenu, AccountMenuLink } from "@/components/app-shell/account-menu";
import type { NavigationItem } from "@/components/app-shell/navigation";
import { SidebarLink } from "@/components/app-shell/sidebar-link";
import { fr } from "@/fr";
import { canManageTeam, canSeePlatform } from "../../admin-access";
import type { PlatformAdmin } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import {
  COMMERCIAL_NAVIGATION,
  PLATFORM_NAVIGATION,
  SUPERADMIN_PLATFORM_NAVIGATION,
} from "./admin-navigation";

const text = backofficeFr.shell;

const PROFILE_SEARCH = { rubrique: "profil" } as const;

const NavigationGroup = ({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly NavigationItem[];
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="px-2.5 pb-0.5 text-[11px] leading-4 font-medium text-[#64748B]">{title}</span>
    {items.map((item) => (
      <SidebarLink key={item.label} item={item} />
    ))}
  </div>
);

export const AdminSidebar = ({ admin }: { readonly admin: PlatformAdmin }) => {
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-5 border-r border-[#E3E8EF] bg-[#F7F9FB] px-3 py-4 lg:flex">
      <div className="flex items-center gap-2 px-2.5">
        <img src={logo} alt={fr.app.name} width={101} height={20} className="h-5 w-auto" />
        <span className="rounded-md bg-[#E6F4EE] px-1.5 py-0.5 text-[11px] leading-4 font-semibold text-[#0B5B43]">
          {text.badge}
        </span>
      </div>
      <nav aria-label={text.navigation} className="flex flex-1 flex-col gap-5">
        <NavigationGroup title={text.commercial} items={COMMERCIAL_NAVIGATION} />
        {canSeePlatform(admin.role) ? (
          <NavigationGroup
            title={text.platform}
            items={canManageTeam(admin.role) ? SUPERADMIN_PLATFORM_NAVIGATION : PLATFORM_NAVIGATION}
          />
        ) : null}
      </nav>
      <div className="border-t border-[#E3E8EF] pt-3">
        <AccountMenu user={admin}>
          <AccountMenuLink>
            <Link to="/admin/configuration" search={PROFILE_SEARCH}>
              <UserRound aria-hidden="true" />
              {text.profile}
            </Link>
          </AccountMenuLink>
          <AccountMenuLink>
            <Link to="/admin/configuration">
              <Settings aria-hidden="true" />
              {text.configuration}
            </Link>
          </AccountMenuLink>
        </AccountMenu>
      </div>
    </aside>
  );
};
