import type { PlatformRole } from "@passalio/shared";

export const TEAM_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1.4fr)_140px_160px_170px_200px] lg:gap-4";

export const TEAM_ROW_CLASS =
  "min-h-16 border-b border-[#EEF2F6] px-4 py-2.5 last:border-b-0 lg:min-h-[60px]";

export const ROLE_BADGE_CLASS: Readonly<Record<PlatformRole, string>> = {
  superadmin: "bg-[#0F2A44] text-white",
  admin: "bg-[#EEF3F8] text-[#334155]",
  sales: "bg-[#E6F4EE] text-[#0B5B43]",
};

export const DIALOG_CONTENT_CLASS =
  "gap-5 p-5 max-lg:top-0 max-lg:left-0 max-lg:h-dvh max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:content-start max-lg:overflow-y-auto max-lg:rounded-none max-lg:border-0 sm:max-w-[540px] lg:rounded-xl lg:p-6";

export const DIALOG_TITLE_CLASS = "text-left text-[19px] font-bold lg:text-lg lg:font-semibold";

export const DIALOG_TEXT_CLASS = "text-left text-[15px] text-[#475569] lg:text-sm";

export const DIALOG_BUTTON_CLASS =
  "h-12 rounded-[10px] text-[15px] font-semibold lg:h-10 lg:rounded-lg lg:px-4 lg:text-sm";
