import { ChevronsUpDown, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { InitialsAvatar } from "@/components/initials-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fr } from "@/fr";
import { useSignOutButton } from "@/lib/use-sign-out-button";

const ITEM_CLASS = "h-8 gap-2.5 px-2.5 text-[13px]";

export type AccountMenuUser = {
  readonly name: string;
  readonly email: string;
};

export const AccountMenuLink = ({ children }: { readonly children: ReactNode }) => (
  <DropdownMenuItem asChild className={ITEM_CLASS}>
    {children}
  </DropdownMenuItem>
);

export const AccountMenu = ({
  user,
  children,
}: {
  readonly user: AccountMenuUser;
  readonly children: ReactNode;
}) => {
  const { signOut, isSigningOut } = useSignOutButton();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left outline-none hover:bg-[#EEF3F8] focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-[#EEF3F8]">
        <InitialsAvatar name={user.name} tone="mint" size="small" />
        <span className="sr-only">{fr.shell.account}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{user.name}</span>
        <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-[#94A3B8]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-72 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-2.5 px-2.5 py-2 font-normal">
          <InitialsAvatar name={user.name} tone="mint" size="small" />
          <span className="flex min-w-0 flex-col">
            <span className="text-[13px] font-semibold break-words">{user.name}</span>
            <span className="text-xs break-all text-[#64748B]">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className={ITEM_CLASS}
          disabled={isSigningOut}
          onSelect={signOut}
        >
          <LogOut aria-hidden="true" />
          {fr.app.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
