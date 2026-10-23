import { redirect } from "@tanstack/react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRememberedCheck, forgetRememberedChecks } from "./remembered-check";

const countingCheck = () => {
  const check = vi.fn<(returnTo: string) => Promise<string>>(async () => "session");
  return { check, remembered: createRememberedCheck(check) };
};

afterEach(() => {
  vi.useRealTimers();
});

describe("createRememberedCheck", () => {
  it("checks once and answers the following navigations without waiting for the network", async () => {
    const { check, remembered } = countingCheck();
    expect(await remembered.read("/")).toBe("session");
    expect(await remembered.read("/clients")).toBe("session");
    expect(await remembered.read("/equipe")).toBe("session");
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("checks again in the background once the answer is a minute old", async () => {
    vi.useFakeTimers();
    const { check, remembered } = countingCheck();
    await remembered.read("/");
    await remembered.revalidateIfStale("/clients");
    expect(check).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60 * 1000);
    await remembered.revalidateIfStale("/clients");
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("forgets the answer when the background check says the session is over", async () => {
    vi.useFakeTimers();
    const { check, remembered } = countingCheck();
    await remembered.read("/");
    vi.advanceTimersByTime(60 * 1000);
    check.mockRejectedValueOnce(redirect({ to: "/connexion" }));
    await expect(remembered.revalidateIfStale("/clients")).rejects.toBeDefined();
    await remembered.read("/clients");
    expect(check).toHaveBeenCalledTimes(3);
  });

  it("keeps the last answer when the background check cannot reach the server", async () => {
    vi.useFakeTimers();
    const { check, remembered } = countingCheck();
    await remembered.read("/");
    vi.advanceTimersByTime(60 * 1000);
    check.mockRejectedValueOnce(new Error("offline"));
    await expect(remembered.revalidateIfStale("/clients")).rejects.toThrow("offline");
    expect(await remembered.read("/clients")).toBe("session");
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("checks again after sign-out", async () => {
    const { check, remembered } = countingCheck();
    await remembered.read("/");
    forgetRememberedChecks();
    await remembered.read("/");
    expect(check).toHaveBeenCalledTimes(2);
  });
});
