import { ScanText, TriangleAlert } from "lucide-react";
import { createContext, useContext } from "react";
import { useWatch, type FieldPath } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { PlateReadingState } from "../../hooks/use-plate-reading";
import { plateFr } from "../../plate-fr";
import {
  PLATE_FORM_FIELDS,
  PLATE_IDENTITY_FIELDS,
  type PlateFormField,
  type PlateIdentityField,
} from "../../plate-reading";
import type { EquipmentFormValues } from "./equipment-form-schema";

export type PlateMark = "reading" | "read" | "unreadable";

const PlateReadingContext = createContext<PlateReadingState>({ step: "idle" });

export const PlateReadingProvider = PlateReadingContext.Provider;

const SKELETON_FIELDS: ReadonlySet<string> = new Set(["brand", "model", "serialNumber", "powerKw"]);

const isPlateFormField = (name: string): name is PlateFormField =>
  PLATE_FORM_FIELDS.some((field) => field === name);

const isIdentityField = (name: string): name is PlateIdentityField =>
  PLATE_IDENTITY_FIELDS.some((field) => field === name);

const markOf = (
  state: PlateReadingState,
  name: string,
  value: EquipmentFormValues[FieldPath<EquipmentFormValues>],
): PlateMark | null => {
  if (state.step === "reading") {
    return SKELETON_FIELDS.has(name) ? "reading" : null;
  }
  if (state.step !== "read" || !isPlateFormField(name)) {
    return null;
  }
  const readValue = state.readValues[name];
  if (readValue !== undefined && readValue === value) {
    return "read";
  }
  const isMissing = isIdentityField(name) && state.missingIdentity.includes(name) && value === "";
  return isMissing ? "unreadable" : null;
};

export const usePlateMark = (name: FieldPath<EquipmentFormValues>): PlateMark | null => {
  const state = useContext(PlateReadingContext);
  const value = useWatch<EquipmentFormValues>({ name });
  return markOf(state, name, value);
};

export const plateFieldClassOf = (mark: PlateMark | null) =>
  mark === "unreadable" ? "border-[#E8B877]" : undefined;

const TAGS: Readonly<
  Record<
    PlateMark,
    { readonly className: string; readonly label: string; readonly isAlert: boolean }
  >
> = {
  reading: { className: "text-[#64748B]", label: plateFr.readingTag, isAlert: false },
  read: { className: "text-[#0E7C5A]", label: plateFr.readTag, isAlert: false },
  unreadable: { className: "text-[#B45309]", label: plateFr.unreadableTag, isAlert: true },
};

export const PlateTag = ({ mark }: { readonly mark: PlateMark | null }) => {
  if (mark === null) {
    return null;
  }
  const { className, label, isAlert } = TAGS[mark];
  const Icon = isAlert ? TriangleAlert : ScanText;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap lg:hidden",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
};
