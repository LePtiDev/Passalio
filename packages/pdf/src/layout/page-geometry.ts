export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 30;
export const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
export const FOOTER_HEIGHT = 46;
export const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_HEIGHT;
export const SECTION_GAP = 10.5;

export const PALETTE = {
  ink: "#0F2A44",
  body: "#334155",
  slate: "#475569",
  muted: "#64748B",
  border: "#E3E8EF",
  divider: "#EEF2F6",
  panel: "#F7F9FB",
  white: "#FFFFFF",
  danger: "#B42318",
  dangerSoft: "#FDEDEC",
  dangerInk: "#7A1A12",
  dashed: "#CBD5E1",
} as const;

export type Theme = {
  readonly accent: string;
  readonly accentSoft: string;
  readonly isBanner: boolean;
};
