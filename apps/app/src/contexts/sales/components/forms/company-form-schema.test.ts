import { describe, expect, it } from "vitest";
import { companyFormSchema, EMPTY_COMPANY_FORM, toCompanyFields } from "./company-form-schema";

describe("companyFormSchema", () => {
  it("turns empty optional fields into null", () => {
    const values = companyFormSchema.parse({
      ...EMPTY_COMPANY_FORM,
      name: " Gaz Hop ",
      department: "2a",
    });
    expect(toCompanyFields(values)).toMatchObject({
      name: "Gaz Hop",
      department: "2A",
      phone: null,
      email: null,
      siren: null,
    });
  });

  it("rejects a wrong department, postal code or SIREN", () => {
    const result = companyFormSchema.safeParse({
      ...EMPTY_COMPANY_FORM,
      name: "Gaz Hop",
      department: "940",
      postalCode: "9414",
      siren: "12345",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map(({ path }) => path[0])).toEqual([
      "postalCode",
      "department",
      "siren",
    ]);
  });
});
