import { documentIssuer, type DocumentIssuer } from "@/lib/db/compliance-records";
import type { LocalDatabase } from "@/lib/db/local-database";

export const readIssuer = async (database: LocalDatabase): Promise<DocumentIssuer | undefined> => {
  const stored = await database.localSettings.get("issuer");
  return stored?.key === "issuer" ? stored.issuer : undefined;
};

export const saveIssuer = (database: LocalDatabase, issuer: DocumentIssuer, at: Date) =>
  database.transaction("rw", database.localSettings, async () => {
    const current = await readIssuer(database);
    if (current !== undefined && JSON.stringify(current) === JSON.stringify(issuer)) {
      return false;
    }
    await database.localSettings.put({
      key: "issuer",
      issuer: documentIssuer.parse(issuer),
      savedAt: at.toISOString(),
    });
    return true;
  });
