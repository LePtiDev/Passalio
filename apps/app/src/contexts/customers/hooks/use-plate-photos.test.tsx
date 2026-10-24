import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { EquipmentKind } from "@passalio/shared";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm, type UseFormReturn } from "react-hook-form";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emptyEquipmentForm,
  type EquipmentFormValues,
} from "../components/equipment/equipment-form-schema";
import type { EquipmentPhotos, PickedPhoto } from "../components/equipment/equipment-photo-tiles";
import { usePlatePhotos } from "./use-plate-photos";

vi.mock("sonner", () => ({ toast: { error: vi.fn<(message: string) => void>() } }));

type PlatePhotosView = ReturnType<typeof usePlatePhotos> & {
  readonly form: UseFormReturn<EquipmentFormValues>;
};

const ALL_FLUE_KINDS: readonly EquipmentKind[] = ["log_stove", "pellet_stove", "boiler"];

const READ_ANSWER = {
  status: "read",
  fields: {
    kind: "pellet_stove",
    brand: "MCZ",
    model: "Ego 2.0 Air 8",
    serialNumber: "SN-4421",
    powerKw: 8,
  },
  fieldCount: 5,
};

let latest: PlatePhotosView | undefined;
let root: Root;
let offeredKinds: readonly EquipmentKind[];

const rememberView = (view: PlatePhotosView) => {
  latest = view;
};

const Probe = ({
  kinds,
  onView,
}: {
  readonly kinds: readonly EquipmentKind[];
  readonly onView: (view: PlatePhotosView) => void;
}) => {
  const form = useForm<EquipmentFormValues>({ defaultValues: emptyEquipmentForm(undefined) });
  onView({ ...usePlatePhotos(form, kinds), form });
  return null;
};

const view = () => {
  if (latest === undefined) {
    throw new Error("hook not rendered");
  }
  return latest;
};

const pictureOf = (name: string): PickedPhoto => ({
  file: new File([new Uint8Array([255, 216, 255, 224])], name, { type: "image/jpeg" }),
  previewUrl: `blob:preview-${name}`,
});

const answering = (body: unknown) =>
  vi.fn<typeof fetch>(async () => Response.json(body, { status: 200 }));

const deferredResponse = () => {
  const answer: { resolve: (response: Response) => void } = { resolve: () => undefined };
  const promise = new Promise<Response>((resolve) => {
    answer.resolve = resolve;
  });
  return { promise, resolve: (response: Response) => answer.resolve(response) };
};

const changePhotos = async (photos: EquipmentPhotos) => {
  await act(async () => {
    view().changePhotos(photos);
  });
};

const addPlate = async (plate: PickedPhoto) => {
  await changePhotos({ ...view().photos, plate });
  await vi.waitFor(() => expect(view().plateReading.state.step).not.toBe("reading"));
};

beforeAll(() => {
  GlobalRegistrator.register();
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(async () => {
  offeredKinds = ALL_FLUE_KINDS;
  latest = undefined;
  Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
  root = createRoot(document.createElement("div"));
  await act(async () => {
    root.render(<Probe kinds={offeredKinds} onView={rememberView} />);
  });
});

afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("usePlatePhotos", () => {
  it("starts with no photo and no reading", () => {
    expect(view().photos).toEqual({ plate: null, overview: null });
    expect(view().plateReading.state).toEqual({ step: "idle" });
  });

  it("reads a new plate photo and fills the empty fields of the form", async () => {
    const fetchMock = answering(READ_ANSWER);
    vi.stubGlobal("fetch", fetchMock);
    const plate = pictureOf("plaque.jpg");
    await addPlate(plate);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/plate-readings",
      expect.objectContaining({ method: "POST", body: plate.file }),
    );
    expect(view().photos.plate).toBe(plate);
    expect(view().form.getValues()).toMatchObject({
      kind: "pellet_stove",
      energy: "pellets",
      brand: "MCZ",
      model: "Ego 2.0 Air 8",
      serialNumber: "SN-4421",
      powerKw: "8",
    });
    expect(view().plateReading.state).toMatchObject({ step: "read", fieldCount: 5 });
  });

  it("keeps what the technician typed, with its dirty, touched and error states", async () => {
    vi.stubGlobal("fetch", answering(READ_ANSWER));
    act(() => {
      view().form.setValue("brand", "Atlantic", { shouldDirty: true, shouldTouch: true });
      view().form.setValue("room", "Salon", { shouldDirty: true, shouldTouch: true });
      view().form.setError("room", { type: "custom", message: "Pièce inconnue" });
    });
    await addPlate(pictureOf("plaque.jpg"));
    expect(view().form.getValues()).toMatchObject({
      brand: "Atlantic",
      model: "Ego 2.0 Air 8",
      room: "Salon",
    });
    expect(view().form.getFieldState("brand")).toMatchObject({ isDirty: true, isTouched: true });
    expect(view().form.getFieldState("room")).toMatchObject({
      isDirty: true,
      isTouched: true,
      error: { message: "Pièce inconnue" },
    });
    expect(view().form.formState.defaultValues).toMatchObject({ brand: "", model: "" });
  });

  it("does not propose a kind the company does not offer", async () => {
    offeredKinds = ["log_stove"];
    await act(async () => {
      root.render(<Probe kinds={offeredKinds} onView={rememberView} />);
    });
    vi.stubGlobal("fetch", answering(READ_ANSWER));
    await addPlate(pictureOf("plaque.jpg"));
    expect(view().form.getValues("kind")).toBeNull();
    expect(view().form.getValues("brand")).toBe("MCZ");
  });

  it("cancels the reading when the plate photo is removed while it is read", async () => {
    const pending = deferredResponse();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(() => pending.promise),
    );
    await changePhotos({ ...view().photos, plate: pictureOf("plaque.jpg") });
    expect(view().plateReading.state).toEqual({ step: "reading" });
    await changePhotos({ ...view().photos, plate: null });
    expect(view().plateReading.state).toEqual({ step: "idle" });
    await act(async () => {
      pending.resolve(Response.json(READ_ANSWER));
      await pending.promise;
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
    });
    expect(view().plateReading.state).toEqual({ step: "idle" });
    expect(view().form.getValues("brand")).toBe("");
  });

  it("returns to idle when the plate photo is removed after a reading", async () => {
    vi.stubGlobal("fetch", answering(READ_ANSWER));
    await addPlate(pictureOf("plaque.jpg"));
    await changePhotos({ ...view().photos, plate: null });
    expect(view().photos.plate).toBeNull();
    expect(view().plateReading.state).toEqual({ step: "idle" });
  });

  it("retakes an unreadable plate: frees the old preview and reads the new photo", async () => {
    const revoked: string[] = [];
    vi.spyOn(URL, "revokeObjectURL").mockImplementation((url: string) => {
      revoked.push(url);
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview-retaken");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ status: "unreadable", fields: {}, fieldCount: 0 }))
      .mockResolvedValueOnce(Response.json(READ_ANSWER));
    vi.stubGlobal("fetch", fetchMock);
    await addPlate(pictureOf("floue.jpg"));
    expect(view().plateReading.state).toEqual({ step: "unreadable" });
    const retaken = new File([new Uint8Array([255, 216])], "nette.jpg", { type: "image/jpeg" });
    await act(async () => {
      view().retakePlate(retaken);
    });
    await vi.waitFor(() => expect(view().plateReading.state.step).toBe("read"));
    expect(revoked).toEqual(["blob:preview-floue.jpg"]);
    expect(view().photos.plate).toEqual({ file: retaken, previewUrl: "blob:preview-retaken" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/plate-readings",
      expect.objectContaining({ body: retaken }),
    );
    expect(view().form.getValues("brand")).toBe("MCZ");
  });

  it("reads again when the plate photo is replaced by another one", async () => {
    const fetchMock = answering(READ_ANSWER);
    vi.stubGlobal("fetch", fetchMock);
    await addPlate(pictureOf("plaque.jpg"));
    const replacement = pictureOf("plaque-2.jpg");
    await addPlate(replacement);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/plate-readings",
      expect.objectContaining({ body: replacement.file }),
    );
  });

  it("does not read the plate again when another photo changes", async () => {
    const fetchMock = answering(READ_ANSWER);
    vi.stubGlobal("fetch", fetchMock);
    await addPlate(pictureOf("plaque.jpg"));
    const readState = view().plateReading.state;
    await changePhotos({ ...view().photos, overview: pictureOf("vue.jpg") });
    await changePhotos({ ...view().photos, overview: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(view().plateReading.state).toBe(readState);
  });

  it("does not read anything when only an overview photo is added", async () => {
    const fetchMock = answering(READ_ANSWER);
    vi.stubGlobal("fetch", fetchMock);
    await changePhotos({ ...view().photos, overview: pictureOf("vue.jpg") });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(view().plateReading.state).toEqual({ step: "idle" });
  });
});
