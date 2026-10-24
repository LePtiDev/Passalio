import type { ServiceChanges, ServiceFields } from "@passalio/trades";
import * as z from "zod";
import { apiRequest } from "@/lib/api-client";
import { serviceRecord } from "@/lib/db/planning-records";

const servicesResponse = z.object({ services: z.array(serviceRecord) });

const serviceResponse = z.object({ service: serviceRecord });

export const servicesApi = {
  fetchServices: () => apiRequest("/services", servicesResponse),
  createService: (fields: ServiceFields) =>
    apiRequest("/services", serviceResponse, { method: "POST", body: fields }),
  updateService: (serviceId: string, changes: ServiceChanges) =>
    apiRequest(`/services/${serviceId}`, serviceResponse, { method: "PATCH", body: changes }),
  archiveService: (serviceId: string) =>
    apiRequest(`/services/${serviceId}/archive`, z.undefined(), { method: "POST" }),
};

export type FetchServices = typeof servicesApi.fetchServices;
