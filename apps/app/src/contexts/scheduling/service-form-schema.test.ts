import { serviceFields } from "@passalio/trades";
import { describe, expect, it } from "vitest";
import type { ServiceRecord } from "@/lib/db/local-records";
import { schedulingFr } from "./fr";
import {
  NEW_SERVICE_FORM,
  serviceFormOf,
  serviceFormSchema,
  toServiceFields,
  type ServiceFormValues,
} from "./service-form-schema";

const errors = schedulingFr.services.errors;

const validForm: ServiceFormValues = {
  name: "Ramonage",
  durationMinutes: 60,
  price: "80",
  document: "chimney_sweeping_certificate",
};

const issuesOf = (values: Record<string, unknown>) => {
  const result = serviceFormSchema.safeParse({ ...validForm, ...values });
  return (result.error?.issues ?? []).map(({ path, message }) => ({
    path: path.join("."),
    message,
  }));
};

const pathsOf = (values: Record<string, unknown>) => [
  ...new Set(issuesOf(values).map(({ path }) => path)),
];

describe("serviceFormSchema", () => {
  it("accepts a complete service", () => {
    expect(issuesOf({})).toEqual([]);
  });

  it("accepts a service on quotation with an empty price", () => {
    expect(issuesOf({ price: "" })).toEqual([]);
  });

  it.each(["75", "75,50", "75.5", "1 200", "80 €"])("accepts the price %j", (price) => {
    expect(issuesOf({ price })).toEqual([]);
  });

  it.each(["abc", "-10", "75,555", "100001"])("refuses the price %j", (price) => {
    expect(issuesOf({ price })).toEqual([{ path: "price", message: errors.price }]);
  });

  it("asks for a name", () => {
    expect(issuesOf({ name: "" })).toEqual([{ path: "name", message: errors.name }]);
    expect(issuesOf({ name: "   " })).toEqual([{ path: "name", message: errors.name }]);
  });

  it("refuses a name longer than 80 characters", () => {
    expect(issuesOf({ name: "a".repeat(81) })).toEqual([{ path: "name", message: errors.name }]);
  });

  it.each([15, 480, 1440, 14400])("accepts a duration of %i minutes", (durationMinutes) => {
    expect(issuesOf({ durationMinutes })).toEqual([]);
  });

  it.each([0, 50, 540, 1500, 15840])("refuses a duration of %i minutes", (durationMinutes) => {
    expect(pathsOf({ durationMinutes })).toEqual(["durationMinutes"]);
  });

  it("refuses an unknown document", () => {
    expect(pathsOf({ document: "invoice" })).toEqual(["document"]);
  });
});

describe("NEW_SERVICE_FORM", () => {
  it("starts with an empty name, one hour, on quotation and no document", () => {
    expect(NEW_SERVICE_FORM).toEqual({
      name: "",
      durationMinutes: 60,
      price: "",
      document: "none",
    });
  });
});

describe("serviceFormOf", () => {
  const service: ServiceRecord = {
    id: "service-1",
    name: "Ramonage",
    durationMinutes: 90,
    priceCents: 7550,
    document: "chimney_sweeping_certificate",
    trade: "chimney_sweeping",
  };

  it("fills the form with the service, its price in euros", () => {
    const form = serviceFormOf(service);
    expect(form.name).toBe("Ramonage");
    expect(form.durationMinutes).toBe(90);
    expect(form.document).toBe("chimney_sweeping_certificate");
    expect(form.price.replaceAll(/\s/g, "")).toBe("75,50€");
  });

  it("leaves the price empty for a service on quotation", () => {
    expect(serviceFormOf({ ...service, priceCents: null }).price).toBe("");
  });

  it("gives back the same price once saved again", () => {
    expect(toServiceFields(serviceFormOf(service), service.trade).priceCents).toBe(7550);
  });
});

describe("toServiceFields", () => {
  it("turns the form into fields the server accepts, keeping the trade", () => {
    const fields = toServiceFields(serviceFormSchema.parse(validForm), "chimney_sweeping");
    expect(fields).toEqual({
      name: "Ramonage",
      durationMinutes: 60,
      priceCents: 8000,
      document: "chimney_sweeping_certificate",
      trade: "chimney_sweeping",
    });
    expect(serviceFields.safeParse(fields).success).toBe(true);
  });

  it("sends a null price for a service on quotation", () => {
    expect(toServiceFields({ ...validForm, price: "" }, null).priceCents).toBeNull();
  });

  it("reads a price with a comma and cents", () => {
    expect(toServiceFields({ ...validForm, price: "75,5" }, null).priceCents).toBe(7550);
  });

  it("keeps a service without trade without trade", () => {
    expect(toServiceFields(validForm, null).trade).toBeNull();
  });

  it("trims the name", () => {
    expect(serviceFormSchema.parse({ ...validForm, name: "  Tubage  " }).name).toBe("Tubage");
  });
});
