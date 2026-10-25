import type { SignUpSettings } from "./sign-up-settings";

export type SignUpSettingsChange = {
  readonly isSignUpOpen: boolean;
  readonly changedAt: Date;
  readonly changedByUserId: string;
};

export type PlatformSettingsRepository = {
  readonly findSignUpSettings: () => Promise<SignUpSettings>;
  readonly saveSignUpSettings: (change: SignUpSettingsChange) => Promise<void>;
};

export type PendingInvitationLookup = {
  readonly hasPendingInvitation: (email: string, now: Date) => Promise<boolean>;
};

export type PlatformSettingsAuditEntry = {
  readonly actorUserId: string;
  readonly action: "platform.sign_up_opened" | "platform.sign_up_closed";
};

export type PlatformSettingsAuditTrail = {
  readonly record: (entry: PlatformSettingsAuditEntry) => Promise<void>;
};

export type PlatformSettingsDependencies = {
  readonly settings: PlatformSettingsRepository;
  readonly invitations: PendingInvitationLookup;
  readonly auditTrail: PlatformSettingsAuditTrail;
  readonly now: () => Date;
};
