import type { PasswordCipher } from "../domain/mail-settings-ports";

const VERSION = "v1";
const IV_BYTES = 12;
const KEY_BYTES = 32;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCodePoint(...bytes));

const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.codePointAt(0) ?? 0);

export class InvalidMailSecretKeyError extends Error {
  constructor() {
    super("MAIL_SECRET_KEY must be 32 bytes encoded in base64");
    this.name = "InvalidMailSecretKeyError";
  }
}

export class UnreadablePasswordCipherError extends Error {
  constructor() {
    super("The stored mailbox password cannot be read with this key");
    this.name = "UnreadablePasswordCipherError";
  }
}

const importKey = async (secret: string | undefined) => {
  const raw = secret === undefined ? new Uint8Array() : fromBase64(secret);
  if (raw.length !== KEY_BYTES) {
    throw new InvalidMailSecretKeyError();
  }
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
};

export const createAesPasswordCipher = (secret: string | undefined): PasswordCipher => ({
  encrypt: async (plain) => {
    const key = await importKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const sealed = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plain),
    );
    return [VERSION, toBase64(iv), toBase64(new Uint8Array(sealed))].join(":");
  },
  decrypt: async (cipher) => {
    const key = await importKey(secret);
    const [version, iv, sealed] = cipher.split(":");
    if (version !== VERSION || iv === undefined || sealed === undefined) {
      throw new UnreadablePasswordCipherError();
    }
    const opened = await crypto.subtle
      .decrypt({ name: "AES-GCM", iv: fromBase64(iv) }, key, fromBase64(sealed))
      .catch(() => {
        throw new UnreadablePasswordCipherError();
      });
    return new TextDecoder().decode(opened);
  },
});
