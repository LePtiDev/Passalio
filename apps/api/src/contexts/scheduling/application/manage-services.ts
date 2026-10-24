import { assertCan, err, newId, ok, type Actor, type Result } from "@passalio/shared";
import type { ServiceChanges, ServiceFields, ServiceResponse } from "@passalio/trades";
import type { Service, ServiceDependencies, ServiceError } from "../domain/service-models";

export const toServiceResponse = ({
  id,
  name,
  durationMinutes,
  priceCents,
  document,
  trade,
}: Service): ServiceResponse => ({ id, name, durationMinutes, priceCents, document, trade });

const definedFieldsOf = (changes: ServiceChanges): Partial<ServiceFields> =>
  Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));

export const listServices =
  ({ services }: ServiceDependencies) =>
  async (actor: Actor): Promise<ServiceResponse[]> => {
    assertCan(actor, "schedule:read");
    return (await services.listActive(actor.organizationId)).map(toServiceResponse);
  };

export const createService =
  ({ services, now }: ServiceDependencies) =>
  async (actor: Actor, fields: ServiceFields): Promise<ServiceResponse> => {
    assertCan(actor, "organization:update");
    const at = now();
    const service: Service = {
      ...fields,
      id: newId(),
      organizationId: actor.organizationId,
      archivedAt: null,
      createdAt: at,
      updatedAt: at,
    };
    await services.create(service);
    return toServiceResponse(service);
  };

export const updateService =
  ({ services, now }: ServiceDependencies) =>
  async (
    actor: Actor,
    input: { readonly serviceId: string; readonly changes: ServiceChanges },
  ): Promise<Result<ServiceResponse, ServiceError>> => {
    assertCan(actor, "organization:update");
    const current = await services.findActive(actor.organizationId, input.serviceId);
    if (current === undefined) {
      return err("service_not_found");
    }
    const changes = { ...input.changes, updatedAt: now() };
    await services.update(actor.organizationId, current.id, changes);
    return ok(toServiceResponse({ ...current, ...definedFieldsOf(changes) }));
  };

export const archiveService =
  ({ services, now }: ServiceDependencies) =>
  async (
    actor: Actor,
    input: { readonly serviceId: string },
  ): Promise<Result<void, ServiceError>> => {
    assertCan(actor, "organization:update");
    const current = await services.findActive(actor.organizationId, input.serviceId);
    if (current === undefined) {
      return err("service_not_found");
    }
    await services.archive(actor.organizationId, current.id, now());
    return ok(undefined);
  };
