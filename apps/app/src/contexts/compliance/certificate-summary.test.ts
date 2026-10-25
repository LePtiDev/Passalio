import { describe, expect, it } from "vitest";
import type { CertificateFormValues } from "./certificate-form";
import { draftSummaryOf } from "./certificate-summary";

const VALUES: CertificateFormValues = {
  flueDesignation: "Conduit maçonné, salon",
  isConnectionPipeSwept: true,
  isMechanicalSweeping: true,
  sweepingExtent: "full_length",
  unsweptPart: "",
  chimneyStacks: "good",
  anomalyKinds: [],
  anomalyDetails: "",
  isDoNotUse: false,
  visitedOn: "2026-10-23",
  lastSweepingOn: "",
  lastServiceOn: "",
};

describe("draftSummaryOf", () => {
  it("states the sweeping result", () => {
    expect(draftSummaryOf(VALUES)).toBe("Vacuité sur toute la longueur");
  });

  it("puts a dangerous flue first and adds the anomalies", () => {
    expect(
      draftSummaryOf({
        ...VALUES,
        isDoNotUse: true,
        sweepingExtent: "partial",
        anomalyKinds: ["soot"],
        anomalyDetails: "débistrage conseillé",
      }),
    ).toBe("Utilisation déconseillée · Ramonage partiel · Bistre ou goudron. débistrage conseillé");
  });
});
