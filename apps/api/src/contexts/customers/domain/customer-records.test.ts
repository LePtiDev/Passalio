import { describe, expect, it } from "vitest";
import { customerUpdates, newCustomer, newSite } from "./customer-records";

const AT = new Date("2026-10-23T10:00:00Z");
const EARLIER = new Date("2026-05-01T08:00:00Z");
const context = { id: "customer-1", organizationId: "organization-a", at: AT };

describe("newCustomer", () => {
  it("builds a person with a normalized search name and empty optional fields", () => {
    expect(
      newCustomer(
        { kind: "individual", civility: "mrs", firstName: "Élodie", lastName: "Lefèvre" },
        { ...context, createdByUserId: "user-1" },
      ),
    ).toEqual({
      isOk: true,
      value: {
        id: "customer-1",
        organizationId: "organization-a",
        kind: "individual",
        civility: "mrs",
        firstName: "Élodie",
        lastName: "Lefèvre",
        companyName: null,
        searchName: "lefevre elodie",
        email: null,
        phone: null,
        secondaryPhone: null,
        billingAddress: null,
        billingPostalCode: null,
        billingCity: null,
        notes: null,
        remindersOptedOutAt: null,
        createdByUserId: "user-1",
        createdAt: AT,
        updatedAt: AT,
      },
    });
  });

  it("refuses a person without last name", () => {
    expect(
      newCustomer(
        { kind: "individual", firstName: "Élodie" },
        { ...context, createdByUserId: "u" },
      ),
    ).toEqual({ isOk: false, error: "customer_name_required" });
  });

  it("dates the reminder opt-out at creation", () => {
    const created = newCustomer(
      { kind: "company", companyName: "Boulangerie", hasOptedOutOfReminders: true },
      { ...context, createdByUserId: "u" },
    );
    expect(created.isOk && created.value.remindersOptedOutAt).toEqual(AT);
  });
});

describe("customerUpdates", () => {
  const created = newCustomer(
    { kind: "individual", firstName: "Élodie", lastName: "Lefèvre" },
    { ...context, at: EARLIER, createdByUserId: "user-1" },
  );
  if (!created.isOk) {
    throw new Error("customer fixture is invalid");
  }
  const current = created.value;

  it("recomputes the search name from the merged names and dates the change", () => {
    expect(customerUpdates(current, { lastName: "Durand" }, AT)).toEqual({
      isOk: true,
      value: {
        lastName: "Durand",
        searchName: "durand elodie",
        remindersOptedOutAt: null,
        updatedAt: AT,
      },
    });
  });

  it("refuses a change that leaves the customer without a name", () => {
    expect(customerUpdates(current, { lastName: null }, AT)).toEqual({
      isOk: false,
      error: "customer_name_required",
    });
  });

  it("keeps the first opt-out date when the customer opts out again", () => {
    const optedOut = { ...current, remindersOptedOutAt: EARLIER };
    const updates = customerUpdates(optedOut, { hasOptedOutOfReminders: true }, AT);
    expect(updates.isOk && updates.value.remindersOptedOutAt).toEqual(EARLIER);
  });

  it("clears the opt-out date when the customer accepts reminders again", () => {
    const optedOut = { ...current, remindersOptedOutAt: EARLIER };
    const updates = customerUpdates(optedOut, { hasOptedOutOfReminders: false }, AT);
    expect(updates.isOk && updates.value.remindersOptedOutAt).toBeNull();
  });

  it("keeps the opt-out date when the change does not mention it", () => {
    const optedOut = { ...current, remindersOptedOutAt: EARLIER };
    const updates = customerUpdates(optedOut, { phone: "0102030405" }, AT);
    expect(updates.isOk && updates.value.remindersOptedOutAt).toEqual(EARLIER);
  });
});

describe("newSite", () => {
  it("builds a site under its customer with empty optional fields", () => {
    expect(
      newSite(
        {
          address: "12 rue Paul Bert",
          postalCode: "94200",
          city: "Ivry",
          buildingType: "apartment",
        },
        { id: "site-1", organizationId: "organization-a", customerId: "customer-1", at: AT },
      ),
    ).toEqual({
      id: "site-1",
      organizationId: "organization-a",
      customerId: "customer-1",
      label: null,
      address: "12 rue Paul Bert",
      addressDetails: null,
      postalCode: "94200",
      city: "Ivry",
      buildingType: "apartment",
      latitude: null,
      longitude: null,
      occupantName: null,
      occupantPhone: null,
      accessNotes: null,
      createdAt: AT,
      updatedAt: AT,
    });
  });
});
