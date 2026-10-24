import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { EquipmentKind } from "@passalio/shared";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { customersFr, ENERGY_LABELS, EQUIPMENT_KIND_LABELS } from "../../fr";
import type { PlateReadingState } from "../../hooks/use-plate-reading";
import { plateFr } from "../../plate-fr";
import { emptyEquipmentForm, type EquipmentFormValues } from "./equipment-form-schema";
import { EnergyField, EquipmentKindField } from "./equipment-kind-field";
import { PlateReadingProvider } from "./plate-marks";

await vi.hoisted(async () => {
  const { GlobalRegistrator: Registrator } = await import("@happy-dom/global-registrator");
  Registrator.register();
});

const text = customersFr.equipmentForm;

const ALL_KINDS: readonly EquipmentKind[] = [
  "open_fireplace",
  "insert",
  "log_stove",
  "pellet_stove",
  "boiler",
  "solid_fuel_cooker",
  "air_to_water_heat_pump",
  "air_to_air_heat_pump",
  "air_conditioner",
];

let root: Root;
let container: HTMLDivElement;
let latestForm: UseFormReturn<EquipmentFormValues> | undefined;

const rememberForm = (form: UseFormReturn<EquipmentFormValues>) => {
  latestForm = form;
};

const KindFields = ({
  kinds,
  values,
  state,
  onForm,
}: {
  readonly kinds: readonly EquipmentKind[];
  readonly values: Partial<EquipmentFormValues>;
  readonly state: PlateReadingState;
  readonly onForm: (form: UseFormReturn<EquipmentFormValues>) => void;
}) => {
  const form = useForm<EquipmentFormValues>({
    defaultValues: { ...emptyEquipmentForm(undefined), ...values },
  });
  onForm(form);
  return (
    <FormProvider {...form}>
      <PlateReadingProvider value={state}>
        <EquipmentKindField kinds={kinds} />
        <EnergyField />
      </PlateReadingProvider>
    </FormProvider>
  );
};

const renderFields = (
  kinds: readonly EquipmentKind[],
  values: Partial<EquipmentFormValues> = {},
  state: PlateReadingState = { step: "idle" },
) => {
  act(() =>
    root.render(<KindFields kinds={kinds} values={values} state={state} onForm={rememberForm} />),
  );
};

const form = () => {
  if (latestForm === undefined) {
    throw new Error("form not rendered");
  }
  return latestForm;
};

const triggerOf = (id: string) => container.querySelector<HTMLButtonElement>(`#${id}`);

const presentTriggerOf = (id: string) => {
  const trigger = triggerOf(id);
  if (trigger === null) {
    throw new Error(`no select ${id}`);
  }
  return trigger;
};

const open = (id: string) => {
  const trigger = presentTriggerOf(id);
  act(() => {
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  });
  const listbox = document.querySelector("[role='listbox']");
  if (listbox === null) {
    throw new Error(`select ${id} did not open`);
  }
  return listbox;
};

const optionTexts = (scope: ParentNode) =>
  [...scope.querySelectorAll("[role='option']")].map((option) => option.textContent);

const groupsOf = (listbox: Element) =>
  [...listbox.querySelectorAll("[role='group']")].map((group) => {
    const labelId = group.getAttribute("aria-labelledby") ?? "";
    return {
      title: document.getElementById(labelId)?.textContent ?? "",
      options: optionTexts(group),
    };
  });

const choose = (listbox: Element, label: string) => {
  const option = [...listbox.querySelectorAll<HTMLElement>("[role='option']")].find(
    (candidate) => candidate.textContent === label,
  );
  if (option === undefined) {
    throw new Error(`no option ${label}`);
  }
  act(() => {
    option.focus();
    option.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  });
};

const tagNextTo = (id: string) => {
  const row = container.querySelector(`label[for='${id}']`)?.parentElement;
  const label = row?.querySelector("label")?.textContent ?? "";
  return (row?.textContent ?? "").slice(label.length);
};

beforeAll(() => {
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  latestForm = undefined;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
  container.remove();
  document.body.innerHTML = "";
});

describe("EquipmentKindField", () => {
  it("asks to choose the type before one is chosen", () => {
    renderFields(ALL_KINDS);
    expect(presentTriggerOf("equipment-kind").textContent).toBe(text.kindPlaceholder);
  });

  it("groups the kinds by trade, flue appliances first", () => {
    renderFields(ALL_KINDS);
    expect(groupsOf(open("equipment-kind"))).toEqual([
      {
        title: "Ramonage et entretien",
        options: [
          "Cheminée ouverte",
          "Insert",
          "Poêle à bûches",
          "Poêle à granulés",
          "Chaudière",
          "Cuisinière",
        ],
      },
      {
        title: "Pompe à chaleur et climatisation",
        options: ["PAC air/eau", "PAC air/air", "Climatisation"],
      },
    ]);
  });

  it("lists only the kinds the company offers, without an empty group", () => {
    renderFields(["log_stove", "pellet_stove"]);
    expect(groupsOf(open("equipment-kind"))).toEqual([
      { title: "Ramonage et entretien", options: ["Poêle à bûches", "Poêle à granulés"] },
    ]);
  });

  it("lists only the heat pump group for a heat pump company", () => {
    renderFields(["air_to_water_heat_pump", "air_conditioner"]);
    expect(groupsOf(open("equipment-kind"))).toEqual([
      { title: "Pompe à chaleur et climatisation", options: ["PAC air/eau", "Climatisation"] },
    ]);
  });

  it("sets the chosen kind with its usual fuel", () => {
    renderFields(ALL_KINDS);
    choose(open("equipment-kind"), EQUIPMENT_KIND_LABELS.pellet_stove);
    expect(form().getValues("kind")).toBe("pellet_stove");
    expect(form().getValues("energy")).toBe("pellets");
    expect(presentTriggerOf("equipment-kind").textContent).toBe("Poêle à granulés");
  });

  it("clears the fuel when the chosen kind has no usual fuel", () => {
    renderFields(ALL_KINDS, { kind: "log_stove", energy: "wood_logs" });
    choose(open("equipment-kind"), EQUIPMENT_KIND_LABELS.boiler);
    expect(form().getValues("kind")).toBe("boiler");
    expect(form().getValues("energy")).toBeNull();
  });

  it("tags the kind read on the plate", () => {
    renderFields(
      ALL_KINDS,
      { kind: "pellet_stove" },
      {
        step: "read",
        isPartial: false,
        fieldCount: 4,
        readValues: { kind: "pellet_stove" },
        missingIdentity: [],
      },
    );
    expect(tagNextTo("equipment-kind")).toBe(plateFr.readTag);
  });
});

describe("EnergyField", () => {
  it("offers the five fuels", () => {
    renderFields(ALL_KINDS, { kind: "boiler" });
    expect(presentTriggerOf("equipment-energy").textContent).toBe(text.energyPlaceholder);
    expect(optionTexts(open("equipment-energy"))).toEqual([
      ENERGY_LABELS.wood_logs,
      ENERGY_LABELS.pellets,
      ENERGY_LABELS.gas,
      ENERGY_LABELS.oil,
      ENERGY_LABELS.coal,
    ]);
  });

  it("sets the chosen fuel", () => {
    renderFields(ALL_KINDS, { kind: "boiler" });
    choose(open("equipment-energy"), ENERGY_LABELS.gas);
    expect(form().getValues("energy")).toBe("gas");
  });

  it("is shown before a kind is chosen", () => {
    renderFields(ALL_KINDS);
    expect(triggerOf("equipment-energy")).not.toBeNull();
  });

  it.each(["air_to_water_heat_pump", "air_to_air_heat_pump", "air_conditioner"] as const)(
    "is hidden for a %s",
    (kind) => {
      renderFields(ALL_KINDS, { kind });
      expect(triggerOf("equipment-energy")).toBeNull();
      expect(container.querySelector("label[for='equipment-energy']")).toBeNull();
    },
  );

  it("disappears when a heat pump is chosen", () => {
    renderFields(ALL_KINDS);
    choose(open("equipment-kind"), EQUIPMENT_KIND_LABELS.air_to_water_heat_pump);
    expect(triggerOf("equipment-energy")).toBeNull();
  });
});
