import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { PlateReadingFields } from "@passalio/shared";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlateMerge } from "../plate-reading";
import { usePlateReading } from "./use-plate-reading";

const toastError = vi.hoisted(() =>
  vi.fn<(message: string, options: { readonly description?: string }) => void>(),
);

vi.mock("sonner", () => ({ toast: { error: toastError } }));

type PlateReadingView = ReturnType<typeof usePlateReading>;

const MERGE: PlateMerge = {
  values: { brand: "MCZ", model: "Ego 2.0 Air 8" },
  defaults: {},
  missingIdentity: ["serialNumber"],
};

let latest: PlateReadingView | undefined;
let root: Root;
let applied: PlateReadingFields[];

const apply = (fields: PlateReadingFields) => {
  applied.push(fields);
  return MERGE;
};

const rememberView = (reading: PlateReadingView) => {
  latest = reading;
};

const Probe = ({ onView }: { readonly onView: (reading: PlateReadingView) => void }) => {
  onView(usePlateReading(apply));
  return null;
};

const view = () => {
  if (latest === undefined) {
    throw new Error("hook not rendered");
  }
  return latest;
};

const PHOTO = new Blob([new Uint8Array([255, 216, 255, 224])], { type: "image/jpeg" });

const answering = (status: number, body: unknown) =>
  vi.fn<typeof fetch>(async () => Response.json(body, { status }));

const deferredResponse = () => {
  const answer: { resolve: (response: Response) => void } = { resolve: () => undefined };
  const promise = new Promise<Response>((resolve) => {
    answer.resolve = resolve;
  });
  return { promise, resolve: (response: Response) => answer.resolve(response) };
};

const setOnline = (isOnline: boolean) => {
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => isOnline });
};

const readPhoto = async () => {
  await act(async () => {
    await view().start(PHOTO);
  });
};

beforeAll(() => {
  GlobalRegistrator.register();
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(async () => {
  applied = [];
  toastError.mockReset();
  setOnline(true);
  root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(<Probe onView={rememberView} />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});

describe("usePlateReading", () => {
  it("sends the photo, applies the fields read and shows how many were read", async () => {
    const fetchMock = answering(200, {
      status: "partial",
      fields: { brand: "MCZ", model: "Ego 2.0 Air 8" },
      fieldCount: 2,
    });
    vi.stubGlobal("fetch", fetchMock);
    await readPhoto();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/plate-readings",
      expect.objectContaining({ method: "POST", body: PHOTO }),
    );
    expect(applied).toEqual([{ brand: "MCZ", model: "Ego 2.0 Air 8" }]);
    expect(view().state).toEqual({
      step: "read",
      isPartial: true,
      fieldCount: 2,
      readValues: MERGE.values,
      missingIdentity: ["serialNumber"],
    });
  });

  it("says the plate is unreadable without touching the form", async () => {
    vi.stubGlobal("fetch", answering(200, { status: "unreadable", fields: {}, fieldCount: 0 }));
    await readPhoto();
    expect(applied).toEqual([]);
    expect(view().state).toEqual({ step: "unreadable" });
  });

  it("pauses the reading once the company reached the daily limit, without an error toast", async () => {
    vi.stubGlobal("fetch", answering(429, { error: "plate_reading_limit_reached", traceId: "t" }));
    await readPhoto();
    expect(view().state).toEqual({ step: "limit" });
    expect(toastError).not.toHaveBeenCalled();
  });

  it("shows an error with the short trace code when the reader fails", async () => {
    vi.stubGlobal(
      "fetch",
      answering(503, { error: "plate_reader_unavailable", traceId: "8c41d2e0ab1234" }),
    );
    await readPhoto();
    expect(view().state).toEqual({ step: "idle" });
    expect(toastError).toHaveBeenCalledWith(
      "La plaque n'a pas pu être lue. Remplissez à la main.",
      {
        description: "Code : 8c41d2e0",
      },
    );
  });

  it("stays silent when no reader is configured", async () => {
    vi.stubGlobal(
      "fetch",
      answering(503, { error: "plate_reader_not_configured", traceId: "8c41d2e0" }),
    );
    await readPhoto();
    expect(view().state).toEqual({ step: "idle" });
    expect(toastError).not.toHaveBeenCalled();
  });

  it("does not call the server without network", async () => {
    const fetchMock = answering(200, {});
    vi.stubGlobal("fetch", fetchMock);
    setOnline(false);
    await readPhoto();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(view().state).toEqual({ step: "idle" });
  });

  it("ignores the answer for a photo removed while it was read", async () => {
    const pending = deferredResponse();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => pending.promise),
    );
    let reading: Promise<void> = Promise.resolve();
    act(() => {
      reading = view().start(PHOTO);
    });
    await vi.waitFor(() => expect(view().state).toEqual({ step: "reading" }));
    act(() => view().cancel());
    await act(async () => {
      pending.resolve(Response.json({ status: "read", fields: { brand: "MCZ" }, fieldCount: 1 }));
      await reading;
    });
    expect(applied).toEqual([]);
    expect(view().state).toEqual({ step: "idle" });
  });
});
