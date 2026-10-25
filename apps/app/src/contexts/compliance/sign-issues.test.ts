import { describe, expect, it } from "vitest";
import { complianceFr } from "./fr";
import { hasSignIssues, signIssuesOf } from "./sign-issues";

const text = complianceFr.sign.errors;

const SIGNED = {
  technicianSignature: "data:image/png;base64,AAAA",
  customerSignature: "data:image/png;base64,BBBB",
  isCustomerAbsent: false,
};

describe("signIssuesOf", () => {
  it("accepts a visit with every certificate filled and both signatures", () => {
    const issues = signIssuesOf(SIGNED, { hasEveryDraft: true });
    expect(issues).toStrictEqual({});
    expect(hasSignIssues(issues)).toBe(false);
  });

  it("asks for every missing piece", () => {
    const issues = signIssuesOf(
      { technicianSignature: null, customerSignature: null, isCustomerAbsent: false },
      { hasEveryDraft: false },
    );
    expect(issues).toStrictEqual({
      certificates: text.missingCertificates,
      technicianSignature: text.technicianSignature,
      customerSignature: text.customerSignature,
    });
    expect(hasSignIssues(issues)).toBe(true);
  });

  it("lets an absent customer go without a signature", () => {
    expect(
      signIssuesOf(
        { ...SIGNED, customerSignature: null, isCustomerAbsent: true },
        { hasEveryDraft: true },
      ),
    ).toStrictEqual({});
  });
});
