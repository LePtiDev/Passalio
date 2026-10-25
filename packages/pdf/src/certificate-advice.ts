import { requiresUsageAdvice, type ChimneySweepingCertificate } from "@passalio/trades";
import { adviceFr, type AdviceCard, type FuelFamily } from "./advice-fr";

type Equipment = ChimneySweepingCertificate["equipment"];

const fuelFamilyOf = ({ kind, energy }: Equipment): FuelFamily => {
  if (energy === "pellets" || (energy === null && kind === "pellet_stove")) {
    return "pellets";
  }
  return energy === "coal" ? "coal" : "wood";
};

const appliancePaceOf = (equipment: Equipment) => {
  if (equipment.kind === "open_fireplace") {
    return "open";
  }
  return fuelFamilyOf(equipment) === "pellets" ? "pellets" : "closed";
};

export const isAdviceDue = (certificate: ChimneySweepingCertificate) =>
  certificate.isAdviceAttached &&
  requiresUsageAdvice({
    kind: certificate.equipment.kind,
    flueType: certificate.equipment.flueType,
  });

export const adviceCardsOf = (equipment: Equipment): readonly AdviceCard[] => {
  const pace = appliancePaceOf(equipment);
  return [
    { title: adviceFr.usageTitle(equipment.kind), body: adviceFr.usage[pace] },
    { title: adviceFr.regulationTitle, body: adviceFr.regulation[pace] },
    { title: adviceFr.fuelTitle, body: adviceFr.fuel[fuelFamilyOf(equipment)] },
    adviceFr.risks,
    adviceFr.frequency,
    adviceFr.needs,
    adviceFr.improvements,
  ];
};
