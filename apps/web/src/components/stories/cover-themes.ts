import type { CoverTheme } from "../../content/content-schema";

export const COVER_THEMES: Readonly<
  Record<CoverTheme, { cover: string; quote: string; chip: string; thumb: string }>
> = {
  navy: {
    cover: "bg-navy",
    quote: "text-white",
    chip: "bg-sun text-navy",
    thumb: "bg-navy text-sun",
  },
  mint: {
    cover: "bg-validated-soft",
    quote: "text-navy",
    chip: "bg-white text-validated",
    thumb: "bg-validated-soft text-validated",
  },
  amber: {
    cover: "bg-amber-soft",
    quote: "text-navy",
    chip: "bg-white text-amber-text",
    thumb: "bg-amber-soft text-amber-text",
  },
};
