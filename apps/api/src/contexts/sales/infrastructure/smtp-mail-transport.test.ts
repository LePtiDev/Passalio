import { describe, expect, it } from "vitest";
import { deliveryErrorOf } from "./smtp-mail-transport";

describe("deliveryErrorOf", () => {
  it.each([
    "Failed to plain authentication: 535 5.7.8 Authentication failed",
    "Failed to login authentication: 535 Invalid credentials",
    "Invalid login: 503",
    "No supported auth method found.",
  ])("reads « %s » as a refused password", (message) => {
    expect(deliveryErrorOf(new Error(message))).toBe("smtp_auth_failed");
  });

  it.each([
    "Socket timeout!",
    "Failed to connect to SMTP server: 554",
    "Timeout while waiting for smtp server response",
    "Failed to start TLS: 454",
  ])("reads « %s » as an unreachable server", (message) => {
    expect(deliveryErrorOf(new Error(message))).toBe("smtp_unreachable");
  });

  it("reads any other refusal, such as a rejected sender, as a refused mail", () => {
    expect(deliveryErrorOf(new Error("Invalid MAIL FROM: <a@b.fr> 550 not allowed"))).toBe(
      "smtp_refused",
    );
    expect(deliveryErrorOf("unexpected")).toBe("smtp_refused");
  });
});
