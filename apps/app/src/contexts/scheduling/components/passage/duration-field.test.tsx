import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { VisitTypeRecord } from "@/lib/db/local-records";
import { DurationField } from "./duration-field";

let root: Root;
let container: HTMLDivElement;

const render = async (
  minutes: number,
  chosen: readonly VisitTypeRecord[],
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
    await render(90, [{ type: "stove_maintenance", minutes: 90 }]);
    const trigger = container.querySelector("#visit-duration");
    expect(trigger?.getAttribute("aria-required")).toBe("true");
    expect(container.textContent).toContain("Durée");
    expect(container.textContent).toContain("*");
  });

  it("names the usual duration of a single type", async () => {
    await render(60, [{ type: "chimney_sweeping", minutes: 60 }]);
    expect(hintText()).toBe("Durée habituelle d'un ramonage. Vous pouvez la changer.");
    expect(buttonNamed("Remettre 1 h")).toBeUndefined();
  });

  it("details the durations of several types", async () => {
    await render(150, [
      { type: "chimney_sweeping", minutes: 60 },
      { type: "stove_maintenance", minutes: 90 },
    ]);
    expect(hintText()).toBe("Ramonage 1 h + entretien de poêle 1 h 30.");
  });

  it("tells a duration changed by hand and restores the usual one", async () => {
    const onChange = vi.fn<(minutes: number) => void>();
    await render(105, [{ type: "chimney_sweeping", minutes: 60 }], onChange);
    expect(hintText()).toContain("Modifiée pour ce passage. Habituellement 1 h.");
    const reset = buttonNamed("Remettre 1 h");
    expect(reset).toBeDefined();
    await act(async () => {
      reset?.click();
    });
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("restores the sum of several types", async () => {
    const onChange = vi.fn<(minutes: number) => void>();
    await render(
      60,
      [
        { type: "chimney_sweeping", minutes: 60 },
        { type: "stove_maintenance", minutes: 90 },
      ],
      onChange,
    );
    expect(hintText()).toContain("Modifiée pour ce passage. Habituellement 2 h 30.");
    await act(async () => {
      buttonNamed("Remettre 2 h 30")?.click();
    });
    expect(onChange).toHaveBeenCalledWith(150);
  });

  it("does not call a duration capped at 8 hours a change made by hand", async () => {
    await render(480, [
      { type: "chimney_sweeping", minutes: 300 },
      { type: "heat_pump_maintenance", minutes: 300 },
    ]);
    expect(hintText()).not.toContain("Modifiée pour ce passage");
    expect(buttonNamed("Remettre 10 h")).toBeUndefined();
  });

  it("never restores a duration longer than 8 hours", async () => {
    const onChange = vi.fn<(minutes: number) => void>();
    await render(
      240,
      [
        { type: "chimney_sweeping", minutes: 300 },
        { type: "heat_pump_maintenance", minutes: 300 },
      ],
      onChange,
    );
    const reset = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.startsWith("Remettre"),
    );
    await act(async () => {
      reset?.click();
    });
    expect(onChange).toHaveBeenCalledWith(480);
  });

  it("asks to choose the duration when no type is chosen", async () => {
    await render(60, []);
    expect(hintText()).toBe("Choisissez la durée prévue.");
  });
});
