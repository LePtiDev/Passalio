import { describe, expect, it } from "vitest";
import {
  createAesPasswordCipher,
  InvalidMailSecretKeyError,
  UnreadablePasswordCipherError,
} from "./aes-password-cipher";

const KEY = btoa(String.fromCodePoint(...new Uint8Array(32).fill(7)));
const OTHER_KEY = btoa(String.fromCodePoint(...new Uint8Array(32).fill(9)));

describe("createAesPasswordCipher", () => {
  it("reads back the password it sealed, without keeping it in clear", async () => {
    const cipher = createAesPasswordCipher(KEY);
    const sealed = await cipher.encrypt("mot-de-passe-application");
    expect(sealed).not.toContain("mot-de-passe-application");
    expect(await cipher.decrypt(sealed)).toBe("mot-de-passe-application");
  });

  it("seals the same password differently each time", async () => {
    const cipher = createAesPasswordCipher(KEY);
    expect(await cipher.encrypt("secret")).not.toBe(await cipher.encrypt("secret"));
  });

  it("refuses to read a password sealed with another key", async () => {
    const sealed = await createAesPasswordCipher(OTHER_KEY).encrypt("secret");
    await expect(createAesPasswordCipher(KEY).decrypt(sealed)).rejects.toBeInstanceOf(
      UnreadablePasswordCipherError,
    );
  });

  it("refuses a sealed value that was tampered with", async () => {
    const cipher = createAesPasswordCipher(KEY);
    const [version, iv] = (await cipher.encrypt("secret")).split(":");
    await expect(cipher.decrypt(`${version}:${iv}:AAAA`)).rejects.toBeInstanceOf(
      UnreadablePasswordCipherError,
    );
  });

  it("refuses a missing or short key", async () => {
    await expect(createAesPasswordCipher(undefined).encrypt("secret")).rejects.toBeInstanceOf(
      InvalidMailSecretKeyError,
    );
    await expect(createAesPasswordCipher(btoa("court")).encrypt("secret")).rejects.toBeInstanceOf(
      InvalidMailSecretKeyError,
    );
  });
});
