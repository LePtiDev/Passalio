import { Outlet } from "@tanstack/react-router";
import { MobileTabBar } from "@/components/app-shell/mobile-tab-bar";
import type { PlatformAdmin } from "../../backoffice-api";
import { backofficeFr } from "../../fr";
import { ADMIN_MOBILE_NAVIGATION } from "./admin-navigation";
import { AdminSidebar } from "./admin-sidebar";

export const AdminLayout = ({ admin }: { readonly admin: PlatformAdmin }) => (
  <div className="min-h-dvh bg-[#F7F9FB] lg:flex lg:bg-white">
    <AdminSidebar admin={admin} />
    <main className="flex min-h-dvh min-w-0 flex-1 flex-col pb-[84px] lg:pb-0">
      <Outlet />
    </main>
    <MobileTabBar items={ADMIN_MOBILE_NAVIGATION} label={backofficeFr.shell.navigation} />
  </div>
);
