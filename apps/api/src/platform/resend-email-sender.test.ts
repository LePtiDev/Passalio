import { describe, expect, it, vi } from "vitest";
import { createEmailSender, EmailDeliveryDisabledError } from "./email";
import type { Logger } from "./logger";
import {
  createResendEmailSender,
  EmailDeliveryFailedError,
  RESEND_EMAILS_URL,
} from "./resend-email-sender";

const SETTINGS = {
  apiKey: "re_test_key",
  from: "Passalio <ne-pas-repondre@passalio.com>",
  assetsUrl: "https://app.passalio.com",
};

const fakeLogger = () => {
  const entries: unknown[] = [];
  const logger: Logger = {
    info: (fields) => entries.push(fields),
    warn: (fields) => entries.push(fields),
    error: (fields) => entries.push(fields),
  };
  return { logger, entries };
};

const parseRequestBody = (init: RequestInit | undefined) =>
  JSON.parse(typeof init?.body === "string" ? init.body : "{}");

describe("createResendEmailSender", () => {
  it("posts the rendered email to Resend with the API key", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ id: "email_1" }));
    const { logger, entries } = fakeLogger();
    const sender = createResendEmailSender(SETTINGS, logger, fetcher);

    await sender.sendInvitation({
      email: "paul@exemple.fr",
      organizationName: "Ramonage Dupont",
      inviterName: "Jean Dupont",
      url: "https://app.passalio.com/invitations/org/inv",
    });

    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe(RESEND_EMAILS_URL);
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer re_test_key");
    const body = parseRequestBody(init);
    expect(body.from).toBe(SETTINGS.from);
    expect(body.to).toEqual(["paul@exemple.fr"]);
    expect(body.subject).toBe("Jean Dupont vous invite sur Passalio");
    expect(body.html).toContain("https://app.passalio.com/invitations/org/inv");
    expect(body.text).toContain("https://app.passalio.com/invitations/org/inv");
    expect(entries).toEqual([{ event: "email_sent", kind: "invitation", emailId: "email_1" }]);
  });

  it("throws and logs without the address when Resend refuses", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response("{}", { status: 422 }));
    const { logger, entries } = fakeLogger();
    const sender = createResendEmailSender(SETTINGS, logger, fetcher);

    await expect(
      sender.sendPasswordReset({ email: "paul@exemple.fr", url: "https://app.passalio.com/r" }),
    ).rejects.toBeInstanceOf(EmailDeliveryFailedError);
    expect(entries).toEqual([{ event: "email_failed", kind: "password_reset", status: 422 }]);
    expect(JSON.stringify(entries)).not.toContain("paul@exemple.fr");
  });
});

describe("createEmailSender", () => {
  it("refuses to send in resend mode when the API key is missing", async () => {
    const { logger } = fakeLogger();
    const sender = createEmailSender(
      { delivery: "resend", resendApiKey: undefined, from: SETTINGS.from, assetsUrl: "" },
      logger,
    );
    await expect(
      sender.sendMagicLink({ email: "a@b.fr", url: "https://x" }),
    ).rejects.toBeInstanceOf(EmailDeliveryDisabledError);
  });

  it("only logs the link in log mode", async () => {
    const { logger, entries } = fakeLogger();
    const sender = createEmailSender(
      { delivery: "log", resendApiKey: "re_unused", from: SETTINGS.from, assetsUrl: "" },
      logger,
    );
    await sender.sendMagicLink({ email: "a@b.fr", url: "https://x" });
    expect(entries).toEqual([{ event: "email_logged", kind: "magic_link", url: "https://x" }]);
  });
});
