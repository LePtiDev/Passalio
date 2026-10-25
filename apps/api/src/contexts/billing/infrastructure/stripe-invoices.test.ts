import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripeInvoiceJson } from "./stripe-fixtures";
import { createStripeGateway, INVOICE_PAGE_SIZE } from "./stripe-gateway";
import { parseInvoices } from "./stripe-payloads";

const gateway = () =>
  createStripeGateway({ secretKey: "sk_test_passalio", paymentMethodConfiguration: null });

const list = (...invoices: Record<string, unknown>[]) => ({ object: "list", data: invoices });

describe("Stripe invoices payload", () => {
  it("reads the number, the date, the total in cents and the PDF link", () => {
    expect(parseInvoices(list(stripeInvoiceJson()))).toEqual([
      {
        id: "in_1",
        number: "PASSALIO-0001",
        issuedAt: new Date("2025-10-24T10:00:00.000Z"),
        totalCents: 2900,
        status: "paid",
        pdfUrl: "https://pay.stripe.com/invoice/acct_1/test_1/pdf",
      },
    ]);
  });

  it("keeps an open invoice that has no number nor PDF yet", () => {
    expect(
      parseInvoices(
        list(stripeInvoiceJson({ status: "open", number: null, invoice_pdf: null })),
      ).at(0),
    ).toMatchObject({ status: "open", number: null, pdfUrl: null });
  });

  it("leaves out draft invoices, which the customer must not see", () => {
    expect(
      parseInvoices(
        list(stripeInvoiceJson({ id: "in_draft", status: "draft" }), stripeInvoiceJson()),
      ).map(({ id }) => id),
    ).toEqual(["in_1"]);
  });

  it("refuses a payload that is not a list of invoices", () => {
    expect(() => parseInvoices({ data: [{ id: "in_1" }] })).toThrow(/created/);
  });
});

describe("Stripe gateway invoices", () => {
  let sent: string[];
  let status: number;

  beforeEach(() => {
    sent = [];
    status = 200;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      sent.push(input instanceof Request ? input.url : String(input));
      return Response.json(list(stripeInvoiceJson()), { status });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the last invoices of the customer", async () => {
    expect(await gateway().listInvoices("cus_Q1")).toHaveLength(1);
    const url = new URL(sent[0] ?? "");
    expect(url.origin + url.pathname).toBe("https://api.stripe.com/v1/invoices");
    expect(url.searchParams.get("customer")).toBe("cus_Q1");
    expect(url.searchParams.get("limit")).toBe(String(INVOICE_PAGE_SIZE));
    expect(INVOICE_PAGE_SIZE).toBe(12);
  });

  it("fails loudly when Stripe refuses the list", async () => {
    status = 500;
    await expect(gateway().listInvoices("cus_Q1")).rejects.toThrow("stripe_request_failed:500");
  });
});
