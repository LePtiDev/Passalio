export const TEAM_SIZES = ["solo", "2_to_5", "6_to_15", "more_than_15"] as const;

export type TeamSize = (typeof TEAM_SIZES)[number];

export const BRAND_COLORS = ["#0F2A44", "#0E7C5A", "#B42318", "#1D4F91", "#334155"] as const;

export type BrandColor = (typeof BRAND_COLORS)[number];

export const DEFAULT_BRAND_COLOR: BrandColor = "#0F2A44";

export const DOCUMENT_NUMBER_PREFIX_PATTERN = /^[A-Za-z0-9/_-]{0,12}$/;

export const MAX_FIRST_DOCUMENT_NUMBER = 999_999;

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const LOGO_CONTENT_TYPES = [
  "image/png",
  "image/svg+xml",
  "image/jpeg",
  "image/webp",
] as const;

export const DOCUMENT_TEMPLATES = ["banner", "plain"] as const;

export type DocumentTemplate = (typeof DOCUMENT_TEMPLATES)[number];

export const DEFAULT_DOCUMENT_TEMPLATE: DocumentTemplate = "banner";

export const DOCUMENT_TEXT_MAX_LENGTH = 300;

export const CONTACT_TEXT_MAX_LENGTH = 120;

export const MAX_SHARE_CAPITAL_EUROS = 1_000_000_000;
