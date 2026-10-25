import { describe, expect, it } from "vitest";
import { invoicesResponse, SOLO_TECHNICIAN_LIMIT, TECHNICIAN_ROLES } from "./billing";

describe("technicians counted by the Solo plan", () => {
  it("counts every role that signs certificates, and not the secretary", () => {
    expect(TECHNICIAN_ROLES).toEqual(["owner", "admin", "technician"]);
  });

  it("includes one technician in Solo", () => {
    expect(SOLO_TECHNICIAN_LIMIT).toBe(1);
  });
});

describe("invoices response", () => {
  it("accepts an invoice without number nor PDF yet", () => {
    const invoices = [
      {
        id: "in_1",
        number: null,
        issuedAt: "2026-10-24T10:00:00.000Z",
        totalCents: 2900,
        status: "open",
        pdfUrl: null,
      },
    ];
    expect(invoicesResponse.parse({ invoices })).toEqual({ invoices });
  });

  it("refuses a draft invoice, which the customer must not see", () => {
    const draft = {
      id: "in_2",
      number: null,
      issuedAt: "2026-10-24T10:00:00.000Z",
      totalCents: 2900,
      status: "draft",
      pdfUrl: null,
    };
    expect(invoicesResponse.safeParse({ invoices: [draft] }).success).toBe(false);
  });
});
