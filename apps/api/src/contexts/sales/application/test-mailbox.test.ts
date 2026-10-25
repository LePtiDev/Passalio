import { ForbiddenError } from "@passalio/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { platformActorWith } from "../../../platform/platform-actor-fixture";
import {
  aMailSettingsChange,
  createInMemoryMailSettingsDependencies,
  createInMemoryMailSettingsState,
  type InMemoryMailSettingsState,
} from "../infrastructure/in-memory-mail-settings-dependencies";
import { saveMailSettings } from "./save-mail-settings";
import { testMailbox } from "./test-mailbox";

const SAVED_AT = new Date("2026-10-24T08:00:00Z");
const TESTED_AT = new Date("2026-10-24T08:05:00Z");

let state: InMemoryMailSettingsState;
const antho = platformActorWith("sales", { userId: "user-sales", name: "Antho" });
const quentin = platformActorWith("superadmin", { userId: "user-superadmin", name: "Quentin" });
const run = () => testMailbox(createInMemoryMailSettingsDependencies(state, () => TESTED_AT));

beforeEach(async () => {
  state = createInMemoryMailSettingsState();
  await saveMailSettings(createInMemoryMailSettingsDependencies(state, () => SAVED_AT))(
    antho,
    "user-sales",
    aMailSettingsChange({ replyTo: "contact@passalio.fr" }),
  );
});

describe("testMailbox", () => {
  it("sends a test mail from the member's mailbox to itself with the opened password", async () => {
    expect(await run()(antho, "user-sales")).toEqual({
      isOk: true,
      value: { sentTo: "antho@passalio.fr", verifiedAt: TESTED_AT },
    });
    expect(state.sent).toEqual([
      {
        mailbox: {
          host: "pro1.mail.ovh.net",
          port: 587,
          username: "antho@passalio.fr",
          password: "mot-de-passe-application",
          senderName: "Antho, Passalio",
          senderAddress: "antho@passalio.fr",
          replyTo: "contact@passalio.fr",
        },
        mail: {
          to: "antho@passalio.fr",
          subject: "Test de votre boîte mail Passalio",
          text: `Envoyé le ${TESTED_AT.toISOString()}`,
          html: "<p>Test</p>",
        },
      },
    ]);
  });

  it("remembers when the mailbox last worked", async () => {
    await run()(antho, "user-sales");
    expect(state.settings[0]?.verifiedAt).toEqual(TESTED_AT);
  });

  it.each(["smtp_auth_failed", "smtp_unreachable", "smtp_refused"] as const)(
    "reports %s and keeps the mailbox unverified",
    async (error) => {
      state.deliveryError = error;
      expect(await run()(antho, "user-sales")).toEqual({ isOk: false, error });
      expect(state.settings[0]?.verifiedAt).toBeNull();
    },
  );

  it("says the mailbox is not set up yet", async () => {
    expect(await run()(quentin, "user-superadmin")).toEqual({
      isOk: false,
      error: "mailbox_not_configured",
    });
    expect(state.sent).toEqual([]);
  });

  it("lets a super admin test another member's mailbox", async () => {
    expect((await run()(quentin, "user-sales")).isOk).toBe(true);
  });

  it.each(["admin", "sales"] as const)(
    "refuses that a %s tests another member's mailbox",
    async (role) => {
      await expect(
        run()(platformActorWith(role, { userId: "user-other" }), "user-sales"),
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(state.sent).toEqual([]);
    },
  );
});
