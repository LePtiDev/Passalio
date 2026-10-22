import { LogOut } from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { OrganizationBadge } from "@/contexts/identity";
import { fr } from "@/fr";
import { useSignOut } from "@/lib/use-sign-out";
import { MAIN_NAVIGATION, SETTINGS_NAVIGATION } from "./navigation";
import { SidebarLink } from "./sidebar-link";

export type SignedInUser = {
  readonly name: string;
  readonly email: string;
};

export const AppSidebar = ({ user }: { readonly user: SignedInUser }) => {
  const signOut = useSignOut();
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-5 border-r border-[#E3E8EF] bg-[#F7F9FB] px-3 py-4 lg:flex">
      <OrganizationBadge />
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
      <div className="flex items-center gap-2.5 border-t border-[#E3E8EF] px-1.5 pt-3.5">
        <InitialsAvatar name={user.name} tone="mint" size="small" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold">{user.name}</span>
          <span className="truncate text-xs text-[#64748B]">{user.email}</span>
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
