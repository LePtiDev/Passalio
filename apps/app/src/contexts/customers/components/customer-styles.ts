export const CARD_CLASS =
  "overflow-hidden rounded-[14px] border border-[#E3E8EF] bg-white lg:rounded-xl";

export const DASHED_CARD_CLASS =
  "flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-[#D5DDE6] bg-white p-5 lg:rounded-xl lg:p-6";

export const FIELD_CLASS =
  "h-12 rounded-[10px] border-[#D5DDE6] bg-white px-3.5 text-base shadow-[0_1px_2px_rgba(15,42,68,0.05)] lg:h-8 lg:rounded-[7px] lg:px-2.5 lg:text-[13px] placeholder:text-[#94A3B8] aria-invalid:border-[#B42318] aria-invalid:ring-[3px] aria-invalid:ring-[#B42318]/15";

export const LABEL_CLASS = "gap-1 text-sm font-semibold lg:text-[13px]";

export const ERROR_TEXT_CLASS = "text-sm text-destructive lg:text-[13px]";

export const HINT_TEXT_CLASS = "text-[13px] text-[#64748B]";

export const SOON_BADGE_CLASS =
  "rounded-full bg-[#EEF3F8] px-1.5 py-px text-[10px] font-semibold tracking-wide text-[#64748B] uppercase";

export const LINK_BUTTON_CLASS =
  "inline-flex h-12 items-center gap-1.5 text-[15px] font-semibold text-[#0E7C5A] hover:text-[#0B6349] lg:h-8 lg:text-[13px]";

export const NEUTRAL_BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-[7px] bg-[#EEF3F8] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[#0F2A44]";

export const CUSTOMER_GRID_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_170px_24px] lg:gap-4";

export const ICON_BUTTON_CLASS =
  "flex size-12 shrink-0 items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F1F5F9] lg:size-8 lg:rounded-[7px]";

export const SELECT_TRIGGER_CLASS = `${FIELD_CLASS} w-full data-[size=default]:h-12 lg:data-[size=default]:h-8 data-[placeholder]:text-[#64748B] data-[state=open]:border-[#0E7C5A] data-[state=open]:ring-[3px] data-[state=open]:ring-[#0E7C5A]/20 [&>svg]:text-[#64748B] [&>svg]:opacity-100 data-[state=open]:[&>svg]:rotate-180`;
