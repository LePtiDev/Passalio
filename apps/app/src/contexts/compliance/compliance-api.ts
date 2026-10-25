import { numberBlockResponse } from "@passalio/shared";
import { apiRequest } from "@/lib/api-client";

export const complianceApi = {
  reserveNumberBlock: (deviceId: string) =>
    apiRequest("/document-number-blocks", numberBlockResponse, {
      method: "POST",
      body: { deviceId },
    }),
};
