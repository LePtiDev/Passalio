import type { TeammateResponse } from "@passalio/shared";
import { ShieldCheck } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InitialsAvatar } from "@/components/initials-avatar";
import { cn } from "@/lib/utils";
import { teamFr } from "../../team-fr";
import { ADMIN_SECONDARY_BUTTON_CLASS } from "../admin-styles";
import type { TeammateSummary } from "./change-role-dialog";
import { RoleBadge } from "./role-badge";
import { lastSignInLabel } from "./team-labels";
import { IDENTITY_TEXT_CLASS, TEAM_GRID_CLASS, TEAM_ROW_CLASS } from "./team-styles";

const MENU_ITEM_CLASS = "min-h-12 text-base";

const TwoFactorStatus = ({ isEnabled }: { readonly isEnabled: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 text-[13px]",
      isEnabled ? "font-medium text-[#0B5B43]" : "font-semibold text-[#B45309]",
    )}
  >
    <ShieldCheck
      aria-hidden="true"
      className={cn("size-3.5", isEnabled ? "text-[#0E7C5A]" : "text-[#F59E0B]")}
    />
    {isEnabled ? teamFr.twoFactorOn : teamFr.twoFactorOff}
  </span>
);

type TeammateRowProps = {
  readonly teammate: TeammateResponse;
  readonly isSelf: boolean;
  readonly now: Date;
  readonly onChangeRole: (teammate: TeammateSummary) => void;
  readonly onRemove: (teammate: TeammateSummary) => void;
};

const Identity = ({
  teammate,
  subtitle,
}: {
  readonly teammate: TeammateResponse;
  readonly subtitle: string;
}) => (
  <span className="flex min-w-0 items-center gap-3 text-left">
    <InitialsAvatar
      name={teammate.name}
      tone={teammate.role === "superadmin" ? "mint" : "slate"}
      size="row"
    />
    <span className={IDENTITY_TEXT_CLASS}>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[15px] font-bold lg:text-[13px]">{teammate.name}</span>
        <span className="lg:hidden">
          <RoleBadge role={teammate.role} />
        </span>
      </span>
      <span className="truncate text-[13px] text-[#64748B]">
        <span className="lg:hidden">{subtitle}</span>
        <span className="hidden lg:inline">{teammate.email}</span>
      </span>
    </span>
  </span>
);

export const TeammateRow = ({
  teammate,
  isSelf,
  now,
  onChangeRole,
  onRemove,
}: TeammateRowProps) => {
  const lastSignIn = lastSignInLabel(teammate.lastSignInAt, now);
  const changeRole = useCallback(() => onChangeRole(teammate), [onChangeRole, teammate]);
  const remove = useCallback(() => onRemove(teammate), [onRemove, teammate]);
  const mobileSubtitle = `${teammate.email} · ${isSelf ? teamFr.youShort : lastSignIn.toLocaleLowerCase("fr")}`;
  return (
    <li className={cn(TEAM_GRID_CLASS, TEAM_ROW_CLASS)}>
      {isSelf ? (
        <Identity teammate={teammate} subtitle={mobileSubtitle} />
      ) : (
        <>
          <span className="hidden min-w-0 lg:flex">
            <Identity teammate={teammate} subtitle={mobileSubtitle} />
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={teamFr.memberActions(teammate.name)}
              className="col-span-2 -mx-2 flex min-h-12 min-w-0 rounded-lg px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              <Identity teammate={teammate} subtitle={mobileSubtitle} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              <DropdownMenuItem className={MENU_ITEM_CLASS} onSelect={changeRole}>
                {teamFr.changeRole}
              </DropdownMenuItem>
              <DropdownMenuItem className={MENU_ITEM_CLASS} variant="destructive" onSelect={remove}>
                {teamFr.remove}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
      <span className="hidden lg:flex">
        <RoleBadge role={teammate.role} />
      </span>
      <span className="hidden text-[13px] text-[#334155] lg:block">{lastSignIn}</span>
      <span className="hidden lg:block">
        <TwoFactorStatus isEnabled={teammate.isTwoFactorEnabled} />
      </span>
      <span className="hidden justify-end gap-1.5 lg:flex">
        {isSelf ? (
          <span className="text-[13px] text-[#64748B]">{teamFr.you}</span>
        ) : (
          <>
            <Button variant="outline" className={ADMIN_SECONDARY_BUTTON_CLASS} onClick={changeRole}>
              {teamFr.changeRole}
            </Button>
            <Button
              variant="outline"
              className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "text-[#B42318] hover:text-[#B42318]")}
              onClick={remove}
            >
              {teamFr.remove}
            </Button>
          </>
        )}
      </span>
    </li>
  );
};
