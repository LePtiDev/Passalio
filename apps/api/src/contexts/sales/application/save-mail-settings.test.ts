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

const NOW = new Date("2026-10-24T08:00:00Z");
const LATER = new Date("2026-10-25T09:30:00Z");

let state: InMemoryMailSettingsState;
let clock: Date;
const run = () => saveMailSettings(createInMemoryMailSettingsDependencies(state, () => clock));
const antho = platformActorWith("sales", { userId: "user-sales", name: "Antho" });
const quentin = platformActorWith("superadmin", { userId: "user-superadmin", name: "Quentin" });

beforeEach(() => {
  state = createInMemoryMailSettingsState();
  clock = NOW;
});

describe("saveMailSettings", () => {
  it("saves a member's own mailbox with the password sealed", async () => {
    expect(await run()(antho, "user-sales", aMailSettingsChange())).toEqual({
      isOk: true,
      value: null,
    });
    expect(state.settings).toEqual([
      {
        userId: "user-sales",
        senderName: "Antho, Passalio",
        senderAddress: "antho@passalio.fr",
        replyTo: null,
        provider: "ovh_email_pro",
        smtpHost: "pro1.mail.ovh.net",
        smtpPort: 587,
        smtpUsername: "antho@passalio.fr",
        smtpPasswordCipher: "scellé:mot-de-passe-application",
        passwordUpdatedAt: NOW,
        verifiedAt: null,
        signature: "Antho\nPassalio",
        reminderNotify: "minutes_15",
        reminderAddress: null,
        updatedByUserId: "user-sales",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);
  });

  it("asks for the password the first time", async () => {
    expect(
      await run()(antho, "user-sales", aMailSettingsChange({ smtpPassword: undefined })),
    ).toEqual({ isOk: false, error: "password_required" });
    expect(state.settings).toEqual([]);
    expect(state.audits).toEqual([]);
  });

  it("keeps the saved password and its date when none is given", async () => {
    await run()(antho, "user-sales", aMailSettingsChange());
    clock = LATER;
    await run()(
      antho,
      "user-sales",
      aMailSettingsChange({ smtpPassword: undefined, signature: "Antho" }),
    );
    expect(state.settings[0]).toMatchObject({
      smtpPasswordCipher: "scellé:mot-de-passe-application",
      passwordUpdatedAt: NOW,
      signature: "Antho",
      createdAt: NOW,
      updatedAt: LATER,
    });
    expect(state.audits.at(-1)?.changes).toEqual(["signature"]);
  });

  it("keeps the last successful test when only the signature or the reminders change", async () => {
    await run()(antho, "user-sales", aMailSettingsChange());
    state.settings.splice(0, 1, { ...state.settings[0]!, verifiedAt: NOW });
    await run()(
      antho,
      "user-sales",
      aMailSettingsChange({ smtpPassword: undefined, reminderNotify: "day_before" }),
    );
    expect(state.settings[0]?.verifiedAt).toEqual(NOW);
  });

  it.each([
    { smtpPassword: "nouveau-mot-de-passe" },
    { smtpHost: "ssl0.ovh.net" },
    { smtpPort: 465 as const },
    { smtpUsername: "contact@passalio.fr" },
    { senderAddress: "contact@passalio.fr" },
  ])("asks for a new test when the connection changes: %o", async (change) => {
    await run()(antho, "user-sales", aMailSettingsChange());
    state.settings.splice(0, 1, { ...state.settings[0]!, verifiedAt: NOW });
    await run()(antho, "user-sales", aMailSettingsChange({ smtpPassword: undefined, ...change }));
    expect(state.settings[0]?.verifiedAt).toBeNull();
  });

  it("writes nothing when nothing changed", async () => {
    await run()(antho, "user-sales", aMailSettingsChange());
    clock = LATER;
    await run()(antho, "user-sales", aMailSettingsChange({ smtpPassword: undefined }));
    expect(state.settings[0]?.updatedAt).toEqual(NOW);
    expect(state.audits).toHaveLength(1);
  });

  it("records every change in the journal, without notifying a member of their own change", async () => {
    await run()(antho, "user-sales", aMailSettingsChange());
    expect(state.audits).toEqual([
      {
        actorUserId: "user-sales",
        memberUserId: "user-sales",
        changes: [
          "senderName",
          "senderAddress",
          "replyTo",
          "provider",
          "smtpHost",
          "smtpPort",
          "smtpUsername",
          "signature",
          "reminderNotify",
          "reminderAddress",
          "smtpPassword",
        ],
      },
    ]);
    expect(state.notices).toEqual([]);
  });

  it("lets a super admin change another member's mailbox and tells the member what changed", async () => {
    await run()(antho, "user-sales", aMailSettingsChange());
    clock = LATER;
    expect(
      await run()(
        quentin,
        "user-sales",
        aMailSettingsChange({ smtpPassword: "remplacé", smtpHost: "ssl0.ovh.net" }),
      ),
    ).toEqual({ isOk: true, value: null });
    expect(state.settings[0]?.updatedByUserId).toBe("user-superadmin");
    expect(state.notices).toEqual([
      {
        member: { id: "user-sales", name: "Antho", email: "antho@passalio.com" },
        editor: quentin,
        changes: ["smtpHost", "smtpPassword"],
        at: LATER,
      },
    ]);
    expect(state.audits.at(-1)).toEqual({
      actorUserId: "user-superadmin",
      memberUserId: "user-sales",
      changes: ["smtpHost", "smtpPassword"],
    });
  });

  it.each(["admin", "sales"] as const)(
    "refuses that a %s changes another member's mailbox",
    async (role) => {
      await expect(
        run()(platformActorWith(role), "user-superadmin", aMailSettingsChange()),
      ).rejects.toBeInstanceOf(ForbiddenError);
      expect(state.settings).toEqual([]);
    },
  );

  it("refuses a member who is not in the Passalio team", async () => {
    expect(await run()(quentin, "user-unknown", aMailSettingsChange())).toEqual({
      isOk: false,
      error: "member_not_found",
    });
  });
});
