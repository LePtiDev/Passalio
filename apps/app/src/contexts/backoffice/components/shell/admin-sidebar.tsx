import { LogOut } from "lucide-react";
import logo from "@/assets/passalio-logo.svg";
import type { NavigationItem } from "@/components/app-shell/navigation";
import { SidebarLink } from "@/components/app-shell/sidebar-link";
import { InitialsAvatar } from "@/components/initials-avatar";
import { fr } from "@/fr";
import { useSignOut } from "@/lib/use-sign-out";
import { canManageTeam, canSeePlatform } from "../../admin-access";
import type { PlatformAdmin } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import {
  COMMERCIAL_NAVIGATION,
  PLATFORM_NAVIGATION,
  SUPERADMIN_PLATFORM_NAVIGATION,
} from "./admin-navigation";

const text = backofficeFr.shell;

const NavigationGroup = ({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly NavigationItem[];
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="px-2.5 pb-1.5 text-xs font-semibold tracking-[0.04em] text-[#64748B] uppercase">
      {title}
    </span>
    {items.map((item) => (
      <SidebarLink key={item.label} item={item} />
    ))}
  </div>
);

export const AdminSidebar = ({ admin }: { readonly admin: PlatformAdmin }) => {
  const signOut = useSignOut();
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-5 border-r border-[#E3E8EF] bg-[#F7F9FB] px-3 py-4 lg:flex">
      <div className="flex flex-col gap-1 px-1.5">
        <img
          src={logo}
          alt={fr.app.name}
          width={101}
          height={20}
          className="h-5 w-auto self-start"
        />
        <span className="text-xs text-[#64748B]">{text.space}</span>
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
      <div className="flex items-center gap-2.5 border-t border-[#E3E8EF] px-1.5 pt-3.5">
        <InitialsAvatar name={admin.name} tone="mint" size="small" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold">{admin.name}</span>
          <span className="truncate text-xs text-[#64748B]">{admin.email}</span>
        </span>
        <button
          type="button"
          onClick={signOut}
          aria-label={fr.app.signOut}
          title={fr.app.signOut}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#64748B] hover:bg-[#EEF3F8] hover:text-[#0F2A44]"
        >
          <LogOut aria-hidden="true" className="size-4" />
        </button>
      </div>
    </aside>
  );
};
