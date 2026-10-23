import type { PlatformRole } from "@passalio/shared";

export const TEAM_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1.4fr)_140px_160px_150px_190px] lg:gap-4";

export const TEAM_ROW_CLASS =
  "min-h-16 border-b border-[#EEF2F6] px-3.5 py-2.5 last:border-b-0 lg:min-h-[60px] lg:px-4 lg:py-1.5";

export const IDENTITY_TEXT_CLASS = "flex min-w-0 flex-col gap-[3px] leading-tight lg:gap-0";

export const ROLE_BADGE_CLASS: Readonly<Record<PlatformRole, string>> = {
  superadmin: "bg-[#0F2A44] text-white",
  admin: "bg-[#EEF3F8] text-[#334155]",
  sales: "bg-[#E6F4EE] text-[#0B5B43]",
};

export const DIALOG_OVERLAY_CLASS = "bg-[rgb(15_42_68/0.3)]";

export const DIALOG_SHADOW_CLASS = "border-0 shadow-[0_10px_30px_rgba(15,42,68,0.15)]";

export const DIALOG_CONTENT_CLASS =
  "gap-0 p-0 max-lg:top-0 max-lg:left-0 max-lg:h-[calc(100dvh-59px-max(14px,env(safe-area-inset-bottom)))] max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:content-start max-lg:rounded-none max-lg:bg-[#F7F9FB] max-lg:shadow-none sm:max-w-[540px] lg:rounded-xl lg:p-6";

export const DIALOG_TITLE_CLASS = "text-left text-lg font-semibold";

export const DIALOG_TEXT_CLASS = "text-left text-[15px] leading-[1.45] text-[#475569] lg:text-sm";

export const DIALOG_BUTTON_CLASS =
  "h-12 rounded-[10px] text-[15px] font-semibold lg:h-10 lg:rounded-lg lg:px-4 lg:text-sm";
