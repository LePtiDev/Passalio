import type { LocalDatabase } from "@/lib/db/local-database";

export const readSavedSignature = async (database: LocalDatabase, userId: string) => {
  const setting = await database.localSettings.get("signature");
  return setting?.key === "signature" && setting.userId === userId ? setting.image : null;
};

export const saveSignature = (database: LocalDatabase, userId: string, image: string) =>
  database.localSettings.put({ key: "signature", userId, image });
