import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { usePlanLabel } from "@/contexts/billing";
import { OrganizationBadge } from "@/contexts/identity";
import { fr } from "@/fr";
import { MAIN_NAVIGATION, SETTINGS_NAVIGATION } from "./navigation";
import { AccountMenu, AccountMenuLink, type AccountMenuUser } from "./account-menu";
import { SidebarLink } from "./sidebar-link";

export type SignedInUser = AccountMenuUser;

export const AppSidebar = ({ user }: { readonly user: SignedInUser }) => {
  const planLabel = usePlanLabel();
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-5 border-r border-[#E3E8EF] bg-[#F7F9FB] px-3 py-4 lg:flex">
      <OrganizationBadge planLabel={planLabel} />
      <nav aria-label={fr.shell.mainNavigation} className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-0.5">
          {MAIN_NAVIGATION.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="px-2.5 pb-1.5 text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase">
            {fr.shell.settings}
          </span>
          {SETTINGS_NAVIGATION.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </div>
      </nav>
      <div className="border-t border-[#E3E8EF] pt-3">
        <AccountMenu user={user}>
          <AccountMenuLink>
            <Link to="/reglages">
              <Settings aria-hidden="true" />
              {fr.shell.settings}
            </Link>
          </AccountMenuLink>
        </AccountMenu>
      </div>
    </aside>
  );
};
