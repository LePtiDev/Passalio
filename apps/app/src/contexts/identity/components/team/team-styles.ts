import type { OrganizationRole } from "@passalio/shared";
import type { AvatarTone } from "@/components/initials-avatar";

export const ROLE_BADGE_CLASS: Readonly<Record<OrganizationRole, string>> = {
  owner: "bg-[#0F2A44] text-white",
  admin: "bg-[#EEF3F8] text-[#0F2A44]",
  secretary: "bg-[#EEF3F8] text-[#0F2A44]",
  technician: "bg-[#EEF3F8] text-[#0F2A44]",
};

export const ROLE_AVATAR_TONE: Readonly<Record<OrganizationRole, AvatarTone>> = {
  owner: "mint",
  admin: "slate",
  secretary: "amber",
  technician: "slate",
};

export const BADGE_CLASS =
  "inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-xs font-semibold whitespace-nowrap lg:rounded-lg lg:text-[13px]";

export const TEAM_CARD_CLASS =
  "overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white lg:rounded-xl";

export const MEMBER_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 lg:grid-cols-[minmax(0,1fr)_200px_160px_48px] lg:gap-4";
