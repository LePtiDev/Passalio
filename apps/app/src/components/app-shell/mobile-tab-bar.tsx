import { Link, useRouterState } from "@tanstack/react-router";
import { fr } from "@/fr";
import { cn } from "@/lib/utils";
import { MOBILE_NAVIGATION, type NavigationItem } from "./navigation";

const TAB_CLASS =
  "flex min-h-[52px] flex-col items-center justify-center gap-1 text-xs font-medium text-[#64748B]";

const ACTIVE_TAB_CLASS = "font-bold text-[#0F2A44]";

const selectPathname = (state: { readonly location: { readonly pathname: string } }) =>
  state.location.pathname;

const isActive = (item: NavigationItem, pathname: string) =>
  (item.activeFor ?? [item.to]).some((path) =>
    item.isExact === true ? pathname === path : path !== null && pathname.startsWith(path),
  );

const Tab = ({ item, pathname }: { readonly item: NavigationItem; readonly pathname: string }) => {
  const Icon = item.icon;
  if (item.to === null) {
    return (
      <span aria-disabled="true" className={cn(TAB_CLASS, "text-[#94A3B8]")}>
        <Icon aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        {item.label}
      </span>
    );
  }
  const isCurrent = isActive(item, pathname);
  return (
    <Link
      to={item.to}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(TAB_CLASS, isCurrent && ACTIVE_TAB_CLASS)}
    >
      <Icon aria-hidden="true" className="size-[22px]" strokeWidth={isCurrent ? 2.2 : 1.8} />
      {item.label}
    </Link>
  );
};

type MobileTabBarProps = {
  readonly items?: readonly NavigationItem[];
  readonly label?: string;
};

export const MobileTabBar = ({
  items = MOBILE_NAVIGATION,
  label = fr.shell.mainNavigation,
}: MobileTabBarProps) => {
  const pathname = useRouterState({ select: selectPathname });
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-[#E3E8EF] bg-white px-2 pt-1.5 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden"
    >
      {items.map((item) => (
        <Tab key={item.label} item={item} pathname={pathname} />
      ))}
    </nav>
  );
};
