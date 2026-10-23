import { describe, expect, it } from "vitest";
import { contactFormSchema, emptyContactForm, toContactFields } from "./contact-form-schema";

describe("contactFormSchema", () => {
  it("requires a company and a last name", () => {
    const result = contactFormSchema.safeParse(emptyContactForm(null));
    expect(result.error?.issues.map(({ path }) => path[0])).toEqual(["companyId", "lastName"]);
  });

  it("sends null for empty optional fields", () => {
    const values = contactFormSchema.parse({
      ...emptyContactForm("company-1"),
      lastName: " Sauvageot ",
      isLeader: true,
    });
    expect(toContactFields(values)).toEqual({
      firstName: null,
      lastName: "Sauvageot",
      jobTitle: null,
      phone: null,
      mobile: null,
      email: null,
      bestTime: null,
      isLeader: true,
      isMain: false,
    });
  });
});
