import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FormProvider, useForm } from "react-hook-form";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { customersFr } from "../../fr";
import type { PlateReadingState } from "../../hooks/use-plate-reading";
import { plateFr } from "../../plate-fr";
import { emptyEquipmentForm, type EquipmentFormValues } from "./equipment-form-schema";
import { EquipmentTextField } from "./equipment-text-field";
import { plateFieldClassOf, PlateReadingProvider } from "./plate-marks";

const text = customersFr.equipmentForm;

const UNREADABLE_BORDER = "border-[#E8B877]";

const FIELDS = [
  { name: "brand", label: text.brand },
  { name: "model", label: text.model },
  { name: "serialNumber", label: text.serialNumber },
  { name: "powerKw", label: text.power },
  { name: "room", label: text.room },
  { name: "refrigerant", label: text.refrigerant },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];

const READ: PlateReadingState = {
  step: "read",
  isPartial: true,
  fieldCount: 2,
  readValues: { brand: "MCZ", powerKw: "8" },
  missingIdentity: ["serialNumber"],
};

const FormWithMarks = ({
  state,
  values,
}: {
  readonly state: PlateReadingState;
  readonly values: Partial<EquipmentFormValues>;
}) => {
  const form = useForm<EquipmentFormValues>({
    defaultValues: { ...emptyEquipmentForm(undefined), ...values },
  });
  return (
    <FormProvider {...form}>
      <PlateReadingProvider value={state}>
        {FIELDS.map((field) => (
          <EquipmentTextField key={field.name} name={field.name} label={field.label} isOptional />
        ))}
      </PlateReadingProvider>
    </FormProvider>
  );
};

let root: Root;
let container: HTMLDivElement;

const renderForm = (state: PlateReadingState, values: Partial<EquipmentFormValues> = {}) => {
  act(() => root.render(<FormWithMarks state={state} values={values} />));
};

const inputOf = (name: FieldName) =>
  container.querySelector<HTMLInputElement>(`#equipment-${name}`);

const presentInputOf = (name: FieldName) => {
  const input = inputOf(name);
  if (input === null) {
    throw new Error(`no input for ${name}`);
  }
  return input;
};

const labelRowOf = (name: FieldName) => {
  const row = container.querySelector(`label[for='equipment-${name}']`)?.parentElement;
  if (row === null || row === undefined) {
    throw new Error(`no label for ${name}`);
  }
  return row;
};

const labelOf = (name: FieldName) => FIELDS.find((field) => field.name === name)?.label ?? "";

const tagOf = (name: FieldName) => {
  const row = labelRowOf(name);
  const label = row.querySelector("label")?.textContent ?? "";
  return (row.textContent ?? "").slice(label.length);
};

const isMarkedOptional = (name: FieldName) =>
  (labelRowOf(name).querySelector("label")?.textContent ?? "").includes(customersFr.form.optional);

const setInputValue = (input: HTMLInputElement, value: string) => {
  Reflect.get(
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value") ?? {},
    "set",
  )?.call(input, value);
};

const typeInto = async (name: FieldName, value: string) => {
  const input = presentInputOf(name);
  act(() => input.focus());
  await act(async () => {
    setInputValue(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  });
};

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("plate marks on the equipment fields", () => {
  it("shows plain optional fields without any mark before a reading", () => {
    renderForm({ step: "idle" });
    for (const { name } of FIELDS) {
      expect(inputOf(name)).not.toBeNull();
      expect(tagOf(name)).toBe("");
      expect(isMarkedOptional(name)).toBe(true);
    }
  });

  it.each(["brand", "model", "serialNumber", "powerKw"] as const)(
    "replaces %s with a skeleton while the plate is read",
    (name) => {
      renderForm({ step: "reading" });
      expect(inputOf(name)).toBeNull();
      expect(container.querySelector(`output[aria-label='${labelOf(name)}']`)).not.toBeNull();
      expect(
        container.querySelector(`output[aria-label='${labelOf(name)}'] [data-slot='skeleton']`),
      ).not.toBeNull();
    },
  );

  it.each(["room", "refrigerant"] as const)("keeps %s editable while the plate is read", (name) => {
    renderForm({ step: "reading" });
    expect(inputOf(name)).not.toBeNull();
    expect(tagOf(name)).toBe("");
  });

  it("tags the fields that still hold the value read on the plate", () => {
    renderForm(READ, { brand: "MCZ", powerKw: "8" });
    expect(tagOf("brand")).toBe(plateFr.readTag);
    expect(tagOf("powerKw")).toBe(plateFr.readTag);
    expect(tagOf("model")).toBe("");
    expect(tagOf("room")).toBe("");
  });

  it("removes the read tag once the technician edits the value", async () => {
    renderForm(READ, { brand: "MCZ", powerKw: "8" });
    await typeInto("brand", "MCZ Group");
    expect(tagOf("brand")).toBe("");
    expect(tagOf("powerKw")).toBe(plateFr.readTag);
  });

  it("marks a missing identity field as unreadable, with an orange border and no optional hint", () => {
    renderForm(READ, { brand: "MCZ", powerKw: "8" });
    expect(tagOf("serialNumber")).toBe(plateFr.unreadableTag);
    expect(presentInputOf("serialNumber").className).toContain(UNREADABLE_BORDER);
    expect(isMarkedOptional("serialNumber")).toBe(false);
    expect(isMarkedOptional("model")).toBe(true);
    expect(presentInputOf("model").className).not.toContain(UNREADABLE_BORDER);
  });

  it("drops the unreadable mark once the technician types the missing value", async () => {
    renderForm(READ, { brand: "MCZ", powerKw: "8" });
    await typeInto("serialNumber", "SN-4421");
    expect(tagOf("serialNumber")).toBe("");
    expect(presentInputOf("serialNumber").className).not.toContain(UNREADABLE_BORDER);
    expect(isMarkedOptional("serialNumber")).toBe(true);
  });

  it("does not mark the fields once the reading is unreadable or paused", () => {
    renderForm({ step: "unreadable" });
    expect(FIELDS.map(({ name }) => tagOf(name))).toEqual(FIELDS.map(() => ""));
    renderForm({ step: "limit" });
    expect(FIELDS.map(({ name }) => tagOf(name))).toEqual(FIELDS.map(() => ""));
  });
});

describe("plateFieldClassOf", () => {
  it("gives an orange border to an unreadable field only", () => {
    expect(plateFieldClassOf("unreadable")).toBe(UNREADABLE_BORDER);
    expect(plateFieldClassOf("read")).toBeUndefined();
    expect(plateFieldClassOf("reading")).toBeUndefined();
    expect(plateFieldClassOf(null)).toBeUndefined();
  });
});
