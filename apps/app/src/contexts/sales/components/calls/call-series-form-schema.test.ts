import { describe, expect, it } from "vitest";
import { callsFr } from "../../fr-calls";
import {
  callSeriesFormSchema,
  emptyCallSeriesForm,
  toCallSeriesSearch,
  validSizeOf,
} from "./call-series-form-schema";

const sizeError = (size: string) =>
  callSeriesFormSchema.safeParse({ ...emptyCallSeriesForm(null), size }).error?.issues[0]?.message;

describe("call series form", () => {
  it("proposes 10 never called companies, in the given department or everywhere", () => {
    expect(emptyCallSeriesForm("94")).toEqual({
      size: "10",
      department: "94",
      target: "never_called",
    });
    expect(emptyCallSeriesForm(null).department).toBe("all");
  });

  it("accepts between 5 and 30 calls only", () => {
    expect(sizeError("5")).toBeUndefined();
    expect(sizeError(" 30 ")).toBeUndefined();
    expect(sizeError("4")).toBe(callsFr.calls.sizeError);
    expect(sizeError("31")).toBe(callsFr.calls.sizeError);
    expect(sizeError("12.5")).toBe(callsFr.calls.sizeError);
    expect(sizeError("")).toBe(callsFr.calls.sizeError);
  });

  it("reads the size for the launch button only when it is valid", () => {
    expect(validSizeOf("12")).toBe(12);
    expect(validSizeOf("50")).toBeNull();
  });

  it("opens the series in the chosen department, or leaves it out for every department", () => {
    expect(toCallSeriesSearch({ size: "8", department: "94", target: "not_reached" })).toEqual({
      nombre: 8,
      cible: "not_reached",
      departement: "94",
    });
    expect(toCallSeriesSearch({ size: "8", department: "all", target: "never_called" })).toEqual({
      nombre: 8,
      cible: "never_called",
    });
  });
});
