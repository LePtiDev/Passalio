import { newId } from "@passalio/shared";
import type { LocalDatabase } from "@/lib/db/local-database";

export const signingDeviceIdOf = (database: LocalDatabase): Promise<string> =>
  database.transaction("rw", database.localSettings, async () => {
    const existing = await database.localSettings.get("device");
    if (existing?.key === "device") {
      return existing.deviceId;
    }
    const deviceId = newId();
    await database.localSettings.put({ key: "device", deviceId });
    return deviceId;
  });
