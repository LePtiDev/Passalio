import { describe, expect, it } from "vitest";
import {
  companySearchText,
  contactNameOf,
  contactSearchName,
  stageCountsOf,
  withChanges,
} from "./prospect-rules";

describe("prospect rules", () => {
  it("fills every stage and totals the counts", () => {
    expect(
      stageCountsOf([
        { stage: "to_qualify", count: 22 },
        { stage: "interested", count: 4 },
      ]),
    ).toEqual({
      all: 26,
      to_qualify: 22,
      qualified: 0,
      interested: 4,
      demo_planned: 0,
      customer: 0,
      not_interested: 0,
    });
  });

  it("searches a company by name, city, postal code and SIREN without accents", () => {
    expect(
      companySearchText({
        name: "Cheminées de l'Île",
        city: "Créteil",
        postalCode: "94000",
        siren: null,
      }),
    ).toBe("cheminees de l ile creteil 94000");
  });

  it("names a contact first name first and sorts by last name", () => {
    const contact = { firstName: "Gilles", lastName: "Sauvageot" };
    expect(contactNameOf(contact)).toBe("Gilles Sauvageot");
    expect(contactSearchName(contact)).toBe("sauvageot gilles");
    expect(contactNameOf({ firstName: null, lastName: "Benet" })).toBe("Benet");
  });

  it("keeps current values for changes left undefined", () => {
    expect(withChanges({ name: "Gaz Hop", city: "Alfortville" }, { city: undefined })).toEqual({
      name: "Gaz Hop",
      city: "Alfortville",
    });
  });
});
