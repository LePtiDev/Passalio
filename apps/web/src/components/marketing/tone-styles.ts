import type { Tone } from "../../content/content-schema";

export const TONE_STYLES: Readonly<Record<Tone, string>> = {
  validated: "bg-validated-soft text-validated",
  warning: "bg-amber-soft text-amber-text",
  neutral: "bg-hairline text-navy",
};
