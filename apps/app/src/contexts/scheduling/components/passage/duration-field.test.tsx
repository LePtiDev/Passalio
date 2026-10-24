import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceRecord } from "@/lib/db/local-records";
import { DurationField } from "./duration-field";

const serviceOf = (name: string, durationMinutes: number): ServiceRecord => ({
  id: `service-${name}`,
  name,
  durationMinutes,
  priceCents: null,
  document: "none",
  trade: null,
});

const sweeping = serviceOf("Ramonage", 60);
const stove = serviceOf("Entretien poêle", 90);

let root: Root;
let container: HTMLDivElement;

const render = async (
  minutes: number,
  chosen: readonly ServiceRecord[],
  onChange: (minutes: number) => void = () => undefined,
) => {
  await act(async () => {
    root.render(<DurationField minutes={minutes} chosen={chosen} onChange={onChange} />);
  });
};

const hintText = () => container.querySelector("#visit-duration-hint")?.textContent ?? "";

const buttonNamed = (name: string) =>
  [...container.querySelectorAll("button")].find((button) => button.textContent === name);

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

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe("DurationField", () => {
  it("is a required field", async () => {
    await render(90, [stove]);
    const trigger = container.querySelector("#visit-duration");
    expect(trigger?.getAttribute("aria-required")).toBe("true");
    expect(container.textContent).toContain("Durée");
    expect(container.textContent).toContain("*");
  });

  it("names the usual duration of a single service", async () => {
    await render(60, [sweeping]);
    expect(hintText()).toBe("Durée habituelle : 1 h. Vous pouvez la changer.");
    expect(buttonNamed("Remettre 1 h")).toBeUndefined();
  });

  it("details the durations of several services", async () => {
    await render(150, [sweeping, stove]);
    expect(hintText()).toBe("Ramonage 1 h + entretien poêle 1 h 30.");
  });

  it("tells a duration changed by hand and restores the usual one", async () => {
    const onChange = vi.fn<(minutes: number) => void>();
    await render(105, [sweeping], onChange);
    expect(hintText()).toContain("Modifiée pour ce passage. Habituellement 1 h.");
    const reset = buttonNamed("Remettre 1 h");
    expect(reset).toBeDefined();
    await act(async () => {
      reset?.click();
    });
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("restores the sum of several services", async () => {
    const onChange = vi.fn<(minutes: number) => void>();
    await render(60, [sweeping, stove], onChange);
    expect(hintText()).toContain("Modifiée pour ce passage. Habituellement 2 h 30.");
    await act(async () => {
      buttonNamed("Remettre 2 h 30")?.click();
    });
    expect(onChange).toHaveBeenCalledWith(150);
  });

  it("does not call a duration capped at 8 hours a change made by hand", async () => {
    await render(480, [serviceOf("Tubage", 300), serviceOf("Entretien PAC", 300)]);
    expect(hintText()).not.toContain("Modifiée pour ce passage");
    expect(buttonNamed("Remettre 10 h")).toBeUndefined();
  });

  it("does not call 8 hours a change made by hand for a service of several days", async () => {
    await render(480, [serviceOf("Tubage", 2880)]);
    expect(hintText()).toBe("Durée habituelle : 2 jours. Vous pouvez la changer.");
  });

  it("never restores a duration longer than 8 hours", async () => {
    const onChange = vi.fn<(minutes: number) => void>();
    await render(240, [serviceOf("Tubage", 2880), stove], onChange);
    expect(hintText()).toContain("Habituellement 8 h.");
    await act(async () => {
      buttonNamed("Remettre 8 h")?.click();
    });
    expect(onChange).toHaveBeenCalledWith(480);
  });

  it("asks to choose the duration when no service is chosen", async () => {
    await render(60, []);
    expect(hintText()).toBe("Choisissez la durée prévue.");
  });
});
