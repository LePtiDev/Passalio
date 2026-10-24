import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { PLATE_READING_DAILY_LIMIT } from "@passalio/shared";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlateReadingState } from "../../hooks/use-plate-reading";
import { plateFr } from "../../plate-fr";
import { PlateReadingBanner, PlateTileOverlay } from "./plate-reading-status";

const READ: PlateReadingState = {
  step: "read",
  isPartial: false,
  fieldCount: 5,
  readValues: { brand: "MCZ", model: "Ego 2.0 Air 8", serialNumber: "SN-1", powerKw: "8" },
  missingIdentity: [],
};

const PARTIAL: PlateReadingState = {
  step: "read",
  isPartial: true,
  fieldCount: 2,
  readValues: { brand: "MCZ", powerKw: "8" },
  missingIdentity: ["model", "serialNumber"],
};

let root: Root;
let container: HTMLDivElement;
let retaken: File[];

const retake = (file: File) => {
  retaken.push(file);
};

const renderBanner = (state: PlateReadingState) => {
  act(() => root.render(<PlateReadingBanner state={state} onRetake={retake} />));
};

const renderOverlay = (state: PlateReadingState) => {
  act(() => root.render(<PlateTileOverlay state={state} />));
};

const banner = () => {
  const output = container.querySelector("output");
  if (output === null) {
    throw new Error("banner not rendered");
  }
  return output;
};

const retakeInput = () => {
  const input = container.querySelector<HTMLInputElement>("label input[type='file']");
  if (input === null) {
    throw new Error("retake input not rendered");
  }
  return input;
};

const pickFiles = (input: HTMLInputElement, files: readonly File[]) => {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: { length: files.length, item: (index: number) => files[index] ?? null },
  });
  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
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
  retaken = [];
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("PlateReadingBanner", () => {
  it("shows nothing before a plate photo is read", () => {
    renderBanner({ step: "idle" });
    expect(container.innerHTML).toBe("");
  });

  it("announces the reading in a slate status banner shown on mobile only", () => {
    renderBanner({ step: "reading" });
    expect(banner().textContent).toBe(`${plateFr.readingTitle}${plateFr.readingText}`);
    expect(banner().className).toContain("bg-[#F7F9FB]");
    expect(banner().className).toContain("lg:hidden");
  });

  it("counts the fields read and asks to check them in a mint banner", () => {
    renderBanner(READ);
    expect(banner().textContent).toBe(`${plateFr.readTitle(5)}${plateFr.readText}`);
    expect(banner().className).toContain("bg-[#F3FAF7]");
  });

  it("names the identity fields left unreadable after a partial reading", () => {
    renderBanner(PARTIAL);
    expect(banner().textContent).toBe(
      `${plateFr.readTitle(2)}${plateFr.partialText(["model", "serialNumber"])}`,
    );
    expect(banner().textContent).toContain(
      "Le modèle et le numéro de série sont illisibles : saisissez-les à la main.",
    );
  });

  it("says the plate is unreadable in an amber banner with a button to retake the photo", () => {
    renderBanner({ step: "unreadable" });
    expect(banner().textContent).toBe(
      `${plateFr.unreadableTitle}${plateFr.unreadableText}${plateFr.retake}`,
    );
    expect(banner().className).toContain("bg-[#FFFAF2]");
    expect(retakeInput().closest("label")?.textContent).toBe(plateFr.retake);
    expect(retakeInput().accept).toBe("image/*");
    expect(retakeInput().getAttribute("capture")).toBe("environment");
  });

  it("hands the new photo over when the technician retakes it", () => {
    renderBanner({ step: "unreadable" });
    const photo = new File([new Uint8Array([1])], "plaque.jpg", { type: "image/jpeg" });
    pickFiles(retakeInput(), [photo]);
    expect(retaken).toEqual([photo]);
  });

  it("does nothing when the camera is closed without a photo", () => {
    renderBanner({ step: "unreadable" });
    pickFiles(retakeInput(), []);
    expect(retaken).toEqual([]);
  });

  it("explains the daily limit in an amber banner without a retake button", () => {
    renderBanner({ step: "limit" });
    expect(banner().textContent).toBe(
      `${plateFr.limitTitle}${plateFr.limitText(PLATE_READING_DAILY_LIMIT)}`,
    );
    expect(banner().textContent).toContain("200 lectures aujourd'hui");
    expect(banner().className).toContain("bg-[#FFFAF2]");
    expect(container.querySelector("input")).toBeNull();
  });
});

describe("PlateTileOverlay", () => {
  it.each([
    ["idle", { step: "idle" }],
    ["limit", { step: "limit" }],
  ] as const)("adds nothing on the tile while %s", (_, state) => {
    renderOverlay(state);
    expect(container.innerHTML).toBe("");
  });

  it("scans the tile with a reading badge while the plate is read", () => {
    renderOverlay({ step: "reading" });
    expect(container.textContent).toBe(plateFr.badges.reading);
    expect(container.querySelector("span[aria-hidden='true']")).not.toBeNull();
  });

  it("marks the tile as read", () => {
    renderOverlay(READ);
    expect(container.textContent).toBe(plateFr.badges.read);
  });

  it("marks the tile as partly read", () => {
    renderOverlay(PARTIAL);
    expect(container.textContent).toBe(plateFr.badges.partial);
  });

  it("marks the tile as unreadable", () => {
    renderOverlay({ step: "unreadable" });
    expect(container.textContent).toBe(plateFr.badges.unreadable);
  });
});
