import { err, ok, type MailSettingsChange } from "@passalio/shared";
import type { MailboxDeliveryError } from "../domain/mail-settings-error";
import type {
  ChangedMailSetting,
  Mailbox,
  MailSettings,
  Member,
  OutgoingMail,
} from "../domain/mail-settings-models";
import type {
  MailSettingsChangeNotice,
  MailSettingsDependencies,
} from "../domain/mail-settings-ports";

export type SentMailboxMail = { readonly mailbox: Mailbox; readonly mail: OutgoingMail };

export type AuditedMailSettings = {
  readonly actorUserId: string;
  readonly memberUserId: string;
  readonly changes: readonly ChangedMailSetting[];
};

export type InMemoryMailSettingsState = {
  readonly members: Member[];
  readonly settings: MailSettings[];
  readonly sent: SentMailboxMail[];
  readonly notices: MailSettingsChangeNotice[];
  readonly audits: AuditedMailSettings[];
  deliveryError: MailboxDeliveryError | null;
};

export const createInMemoryMailSettingsState = (): InMemoryMailSettingsState => ({
  members: [
    { id: "user-sales", name: "Antho", email: "antho@passalio.com" },
    { id: "user-superadmin", name: "Quentin", email: "quentin@passalio.com" },
  ],
  settings: [],
  sent: [],
  notices: [],
  audits: [],
  deliveryError: null,
});

export const SEALED_PREFIX = "scellé:";

export const aMailSettingsChange = (
  overrides: Partial<MailSettingsChange> = {},
): MailSettingsChange => ({
  senderName: "Antho, Passalio",
  senderAddress: "antho@passalio.fr",
  replyTo: null,
  provider: "ovh_email_pro",
  smtpHost: "pro1.mail.ovh.net",
  smtpPort: 587,
  smtpUsername: "antho@passalio.fr",
  smtpPassword: "mot-de-passe-application",
  signature: "Antho\nPassalio",
  reminderNotify: "minutes_15",
  reminderAddress: null,
  ...overrides,
});

export const createInMemoryMailSettingsDependencies = (
  state: InMemoryMailSettingsState,
  now: () => Date,
): MailSettingsDependencies => ({
  settings: {
    find: async (userId) => {
      const found = state.settings.find((settings) => settings.userId === userId);
      const editor = state.members.find((member) => member.id === found?.updatedByUserId);
      return found === undefined ? undefined : { ...found, updatedByName: editor?.name ?? null };
    },
    save: async (settings) => {
      const index = state.settings.findIndex(({ userId }) => userId === settings.userId);
      state.settings.splice(index === -1 ? state.settings.length : index, 1, settings);
    },
    markVerified: async (userId, at) => {
      const index = state.settings.findIndex((settings) => settings.userId === userId);
      const found = state.settings[index];
      if (found !== undefined) {
        state.settings.splice(index, 1, { ...found, verifiedAt: at });
      }
    },
  },
  cipher: {
    encrypt: async (plain) => `${SEALED_PREFIX}${plain}`,
    decrypt: async (sealed) => sealed.slice(SEALED_PREFIX.length),
  },
  transport: {
    send: async (mailbox, mail) => {
      if (state.deliveryError !== null) {
        return err(state.deliveryError);
      }
      state.sent.push({ mailbox, mail });
      return ok(null);
    },
  },
  members: { find: async (userId) => state.members.find((member) => member.id === userId) },
  notifier: {
    changedByOther: async (notice) => {
      state.notices.push(notice);
    },
  },
  audit: {
    updated: async (actorUserId, memberUserId, changes) => {
      state.audits.push({ actorUserId, memberUserId, changes });
    },
  },
  testContent: (at) => ({
    subject: "Test de votre boîte mail Passalio",
    text: `Envoyé le ${at.toISOString()}`,
    html: "<p>Test</p>",
  }),
  now,
});
