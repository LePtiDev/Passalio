import type { CSSProperties } from "react";

export type TechnicianColor = {
  readonly bar: string;
  readonly background: string;
  readonly text: string;
  readonly blockStyle: CSSProperties;
  readonly avatarStyle: CSSProperties;
};

const technicianColor = (bar: string, background: string, text: string): TechnicianColor => ({
  bar,
  background,
  text,
  blockStyle: { background, borderColor: bar, color: text },
  avatarStyle: { background, color: text },
});

const BLUE = technicianColor("#3B82F6", "#E8F0FE", "#1E3A8A");

export const TECHNICIAN_COLORS: readonly TechnicianColor[] = [
  BLUE,
  technicianColor("#10B981", "#E3F5EC", "#065F46"),
  technicianColor("#8B5CF6", "#F0EBFE", "#4C1D95"),
  technicianColor("#EC4899", "#FCE9F3", "#831843"),
  technicianColor("#14B8A6", "#E1F5F2", "#134E4A"),
  technicianColor("#6366F1", "#ECEDFD", "#312E81"),
  technicianColor("#65A30D", "#EEF6E0", "#365314"),
  technicianColor("#64748B", "#EEF1F5", "#1E293B"),
];

export const colorAt = (index: number): TechnicianColor =>
  TECHNICIAN_COLORS[index % TECHNICIAN_COLORS.length] ?? BLUE;
