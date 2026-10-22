import { Link } from "@tanstack/react-router";
import { ChevronRight, LogOut } from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { fr } from "@/fr";
import { useSignOut } from "@/lib/use-sign-out";
import type { SignedInUser } from "./app-sidebar";
import { SETTINGS_NAVIGATION } from "./navigation";
import { DesktopTopBar, MobileTopBar, PageContent } from "./page-bars";

const TRAIL = [{ label: fr.shell.settings }] as const;

const ROW_CLASS =
  "flex min-h-14 items-center gap-3 border-b border-[#EEF2F6] px-3.5 text-[15px] font-semibold last:border-b-0 lg:min-h-11 lg:px-4 lg:text-[13px]";

const CARD_CLASS =
  "overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white lg:max-w-xl lg:rounded-[10px]";

export const SettingsScreen = ({ user }: { readonly user: SignedInUser }) => {
  const signOut = useSignOut();
  return (
    <>
      <DesktopTopBar trail={TRAIL} />
      <MobileTopBar>
        <h1 className="px-1 text-[17px] font-bold">{fr.settings.title}</h1>
      </MobileTopBar>
      <PageContent>
        <h1 className="hidden text-xl font-bold tracking-[-0.015em] lg:block">
          {fr.settings.title}
        </h1>
        <ul className={CARD_CLASS}>
          {SETTINGS_NAVIGATION.map(({ label, icon: Icon, to }) => (
            <li key={label} className="border-b border-[#EEF2F6] last:border-b-0">
              {to === null ? (
                <span aria-disabled="true" className={`${ROW_CLASS} text-[#94A3B8]`}>
                  <Icon aria-hidden="true" className="size-5 lg:size-4" strokeWidth={1.8} />
                  <span className="flex-1">{label}</span>
                  <span className="rounded-full bg-[#EEF3F8] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                    {fr.shell.soon}
                  </span>
                </span>
              ) : (
                <Link to={to} className={`${ROW_CLASS} hover:bg-[#F7F9FB]`}>
                  <Icon
                    aria-hidden="true"
                    className="size-5 text-success lg:size-4"
                    strokeWidth={1.8}
                  />
                  <span className="flex-1">{label}</span>
                  <ChevronRight aria-hidden="true" className="size-[18px] text-[#94A3B8]" />
                </Link>
              )}
            </li>
          ))}
        </ul>
        <div className={CARD_CLASS}>
          <div className="flex items-center gap-3 border-b border-[#EEF2F6] p-3.5 lg:px-4">
            <InitialsAvatar name={user.name} tone="mint" size="medium" />
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-[#64748B]">{fr.settings.signedInAs}</span>
              <span className="truncate text-[15px] font-semibold lg:text-[13px]">
                {user.email}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-14 w-full items-center gap-3 px-3.5 text-[15px] font-semibold text-destructive hover:bg-[#FEF3F2] lg:min-h-11 lg:px-4 lg:text-[13px]"
          >
            <LogOut aria-hidden="true" className="size-5 lg:size-4" />
            {fr.app.signOut}
          </button>
        </div>
      </PageContent>
    </>
  );
};
