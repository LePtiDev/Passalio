import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { plateImageOf } from "./plate-image";

type Encoding = {
  readonly width: number;
  readonly height: number;
  readonly type: string | undefined;
  readonly quality: unknown;
};

const ENCODED = new Blob([new Uint8Array([255, 216, 255, 219])], { type: "image/jpeg" });

let encodings: Encoding[];
let encodedBlob: Blob | null;
let closedBitmaps: number;

const photoOf = (size: number, type: string) => new Blob([new Uint8Array(size)], { type });

const decodingAs = (width: number, height: number) =>
  vi.fn<typeof createImageBitmap>(async () => ({
    width,
    height,
    close: () => {
      closedBitmaps += 1;
    },
  }));

const recordEncoding = function record(
  this: HTMLCanvasElement,
  callback: BlobCallback,
  type?: string,
  quality?: unknown,
) {
  encodings.push({ width: this.width, height: this.height, type, quality });
  callback(encodedBlob);
};

beforeAll(() => {
  GlobalRegistrator.register();
});

afterAll(async () => {
  await GlobalRegistrator.unregister();
});

beforeEach(() => {
  encodings = [];
  encodedBlob = ENCODED;
  closedBitmaps = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(recordEncoding);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("plateImageOf", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "sends a small %s photo as it is, without decoding it",
    async (type) => {
      const decode = decodingAs(4000, 3000);
      vi.stubGlobal("createImageBitmap", decode);
      const photo = photoOf(200_000, type);
      expect(await plateImageOf(photo)).toBe(photo);
      expect(decode).not.toHaveBeenCalled();
      expect(encodings).toEqual([]);
    },
  );

  it("sends a JPEG of exactly 1.5 MB as it is", async () => {
    const decode = decodingAs(4000, 3000);
    vi.stubGlobal("createImageBitmap", decode);
    const photo = photoOf(1_500_000, "image/jpeg");
    expect(await plateImageOf(photo)).toBe(photo);
    expect(decode).not.toHaveBeenCalled();
  });

  it("redraws a landscape photo over 1.5 MB to 2048 px on its longest side as JPEG quality 0.85", async () => {
    const photo = photoOf(1_500_001, "image/jpeg");
    const decode = decodingAs(4000, 3000);
    vi.stubGlobal("createImageBitmap", decode);
    expect(await plateImageOf(photo)).toBe(ENCODED);
    expect(decode).toHaveBeenCalledWith(photo);
    expect(encodings).toEqual([{ width: 2048, height: 1536, type: "image/jpeg", quality: 0.85 }]);
  });

  it("redraws a portrait photo over 1.5 MB to 2048 px on its height", async () => {
    vi.stubGlobal("createImageBitmap", decodingAs(3000, 4000));
    expect(await plateImageOf(photoOf(3_000_000, "image/png"))).toBe(ENCODED);
    expect(encodings).toEqual([{ width: 1536, height: 2048, type: "image/jpeg", quality: 0.85 }]);
  });

  it("converts a small HEIC photo to JPEG without enlarging it", async () => {
    vi.stubGlobal("createImageBitmap", decodingAs(1000, 800));
    expect(await plateImageOf(photoOf(300_000, "image/heic"))).toBe(ENCODED);
    expect(encodings).toEqual([{ width: 1000, height: 800, type: "image/jpeg", quality: 0.85 }]);
  });

  it("releases the decoded image once it is redrawn", async () => {
    vi.stubGlobal("createImageBitmap", decodingAs(4000, 3000));
    await plateImageOf(photoOf(2_000_000, "image/jpeg"));
    expect(closedBitmaps).toBe(1);
  });

  it("sends the original file when the browser cannot decode images", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const photo = photoOf(2_000_000, "image/heic");
    expect(await plateImageOf(photo)).toBe(photo);
    expect(encodings).toEqual([]);
  });

  it("sends the original file when decoding fails", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn<typeof createImageBitmap>(async () => {
        throw new DOMException("cannot decode", "InvalidStateError");
      }),
    );
    const photo = photoOf(2_000_000, "image/heic");
    expect(await plateImageOf(photo)).toBe(photo);
  });

  it("sends the original file when the redrawn image cannot be encoded", async () => {
    encodedBlob = null;
    vi.stubGlobal("createImageBitmap", decodingAs(4000, 3000));
    const photo = photoOf(2_000_000, "image/jpeg");
    expect(await plateImageOf(photo)).toBe(photo);
  });
});
