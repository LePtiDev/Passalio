import type {
  PlatformSettingsAuditEntry,
  PlatformSettingsDependencies,
  SignUpSettingsChange,
} from "../domain/platform-settings-ports";
import { DEFAULT_SIGN_UP_SETTINGS } from "../domain/sign-up-settings";

export type InMemoryPendingInvitation = {
  readonly email: string;
  readonly expiresAt: Date;
};

export type InMemoryPlatformSettingsState = {
  readonly changes: SignUpSettingsChange[];
  readonly userNames: Map<string, string>;
  readonly pendingInvitations: InMemoryPendingInvitation[];
  readonly auditEntries: PlatformSettingsAuditEntry[];
};

export const createInMemoryPlatformSettingsState = (): InMemoryPlatformSettingsState => ({
  changes: [],
  userNames: new Map(),
  pendingInvitations: [],
  auditEntries: [],
});

export const createInMemoryPlatformSettingsDependencies = (
  state: InMemoryPlatformSettingsState,
  now: () => Date,
): PlatformSettingsDependencies => ({
  settings: {
    findSignUpSettings: async () => {
      const latest = state.changes.at(-1);
      return latest === undefined
        ? DEFAULT_SIGN_UP_SETTINGS
        : {
            isSignUpOpen: latest.isSignUpOpen,
            changedAt: latest.changedAt,
            changedByName: state.userNames.get(latest.changedByUserId) ?? null,
          };
    },
    saveSignUpSettings: async (change) => {
      state.changes.push(change);
    },
  },
  invitations: {
    hasPendingInvitation: async (email, at) =>
      state.pendingInvitations.some(
        (invitation) => invitation.email === email && invitation.expiresAt > at,
      ),
  },
  auditTrail: {
    record: async (entry) => {
      state.auditEntries.push(entry);
    },
  },
  now,
});
