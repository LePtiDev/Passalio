import { BRANDED_CERTIFICATE_TEMPLATE_VERSION } from "@passalio/trades";
import { beforeEach, describe, expect, it } from "vitest";
import type { InMemoryComplianceState } from "../infrastructure/in-memory-compliance-dependencies";
import { validBrandedCertificateData, validCertificateData } from "./certificate-data.fixture";
import {
  actorOf,
  complianceDependenciesOf,
  reserveFor,
  seededComplianceState,
  signInput,
} from "./compliance.fixture";
import { signDocument } from "./sign-document";

let state: InMemoryComplianceState;
let dependencies: ReturnType<typeof complianceDependenciesOf>;

const technician = actorOf("technician");

beforeEach(async () => {
  state = seededComplianceState();
  dependencies = complianceDependenciesOf(state);
  await reserveFor(dependencies, technician);
});

describe("signDocument with the branding frozen in the certificate", () => {
  it("stores the version 2 certificate with its frozen branding", async () => {
    const data = validBrandedCertificateData();
    const signed = await signDocument(dependencies)(
      technician,
      signInput({ templateVersion: BRANDED_CERTIFICATE_TEMPLATE_VERSION, data }),
    );
    expect(signed).toMatchObject({
      isOk: true,
      value: { templateVersion: BRANDED_CERTIFICATE_TEMPLATE_VERSION, data },
    });
    expect(state.documents).toHaveLength(1);
  });

  it("refuses a version 2 certificate without its branding", async () => {
    expect(
      await signDocument(dependencies)(
        technician,
        signInput({
          templateVersion: BRANDED_CERTIFICATE_TEMPLATE_VERSION,
          data: validCertificateData(),
        }),
      ),
    ).toEqual({ isOk: false, error: "invalid_certificate" });
    expect(state.documents).toHaveLength(0);
  });

  it("applies the certificate rules to version 2", async () => {
    expect(
      await signDocument(dependencies)(
        technician,
        signInput({
          templateVersion: BRANDED_CERTIFICATE_TEMPLATE_VERSION,
          data: validBrandedCertificateData({ customerSignature: null, isCustomerAbsent: false }),
        }),
      ),
    ).toEqual({ isOk: false, error: "customer_signature_required" });
    expect(state.documents).toHaveLength(0);
  });
});
