import type { ChimneySweepingCertificate } from "@passalio/trades";
import { longDate } from "./format";
import { pdfFr } from "./fr";

export type Field = { readonly label: string; readonly value: string };

export type FlueRow = {
  readonly designation: string;
  readonly appliance: string;
  readonly result: string;
  readonly isComplete: boolean;
};

const knownOr = (value: string | null) => value ?? pdfFr.equipmentFields.unknown;

const dateOrUnknown = (value: string | null) => knownOr(value === null ? null : longDate(value));

const joined = (...parts: readonly (string | null)[]) => {
  const present = parts.filter((part): part is string => part !== null);
  return present.length === 0 ? null : present.join(" ");
};

export const equipmentFieldsOf = ({
  equipment,
  lastSweepingOn,
  lastServiceOn,
}: ChimneySweepingCertificate) => {
  const labels = pdfFr.equipmentFields;
  const fields: readonly Field[] = [
    { label: labels.kind, value: pdfFr.equipmentKinds[equipment.kind] },
    { label: labels.energy, value: knownOr(equipment.energy && pdfFr.energies[equipment.energy]) },
    { label: labels.brandAndModel, value: knownOr(joined(equipment.brand, equipment.model)) },
    { label: labels.serialNumber, value: knownOr(equipment.serialNumber) },
    {
      label: labels.flueType,
      value: knownOr(equipment.flueType && pdfFr.flueTypes[equipment.flueType]),
    },
    { label: labels.lastSweepingOn, value: dateOrUnknown(lastSweepingOn) },
    { label: labels.lastServiceOn, value: dateOrUnknown(lastServiceOn) },
  ];
  return fields;
};

export const fluesOf = ({ flues, equipment, sweepingExtent }: ChimneySweepingCertificate) => {
  const appliance =
    joined(pdfFr.equipmentKinds[equipment.kind], equipment.brand, equipment.model) ?? "";
  return flues.map(({ designation }): FlueRow => ({
    designation,
    appliance,
    result: pdfFr.results[sweepingExtent],
    isComplete: sweepingExtent === "full_length",
  }));
};
