import { describe, expect, it, vi } from "vitest";

vi.mock("./backoffice-api", () => ({ backofficeApi: {} }));

const { canSeePlatform } = await import("./admin-access");

describe("canSeePlatform", () => {
  it("keeps the sales role inside the Commercial space", () => {
    expect(canSeePlatform("sales")).toBe(false);
  });

  it("opens the platform pages to the Passalio team", () => {
    expect(canSeePlatform("superadmin")).toBe(true);
    expect(canSeePlatform("admin")).toBe(true);
  });
});
