import { ForbiddenError, type OrganizationRole } from "@passalio/shared";
import type { ServiceFields } from "@passalio/trades";
import { beforeEach, describe, expect, it } from "vitest";
import type { Service } from "../domain/service-models";
import { createInMemoryServiceDependencies } from "../infrastructure/in-memory-service-repository";
import { archiveService, createService, listServices, updateService } from "./manage-services";
import { actorOf, ORGANIZATION_A, ORGANIZATION_B } from "./scheduling.fixture";

const CREATED_AT = new Date("2026-10-20T08:00:00Z");
const SWEEPING_ID = "0190f3a0-0000-7000-8000-000000000501";
const STOVE_ID = "0190f3a0-0000-7000-8000-000000000502";
const ARCHIVED_ID = "0190f3a0-0000-7000-8000-000000000503";
const FOREIGN_ID = "0190f3a0-0000-7000-8000-000000000504";
const UNKNOWN_ID = "0190f3a0-0000-7000-8000-000000000599";

const serviceOf = (
  id: string,
  organizationId: string,
  overrides: Partial<Service> = {},
): Service => ({
  id,
  organizationId,
  name: "Ramonage",
  durationMinutes: 60,
  priceCents: 8000,
  document: "chimney_sweeping_certificate",
  trade: "chimney_sweeping",
  archivedAt: null,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...overrides,
});

const NEW_SERVICE: ServiceFields = {
  name: "Débistrage",
  durationMinutes: 2 * 1440,
  priceCents: null,
  document: "none",
  trade: null,
};

let stored: Service[];
let clock: number;
const dependencies = () =>
  createInMemoryServiceDependencies(stored, () => new Date((clock += 1000)));
const storedById = (id: string) => stored.find((service) => service.id === id);

beforeEach(() => {
  clock = Date.parse("2026-10-24T10:00:00Z");
  stored = [
    serviceOf(SWEEPING_ID, ORGANIZATION_A),
    serviceOf(STOVE_ID, ORGANIZATION_A, {
      name: "Entretien poêle",
      durationMinutes: 90,
      priceCents: null,
      document: "maintenance_certificate",
      trade: "stove_maintenance",
    }),
    serviceOf(ARCHIVED_ID, ORGANIZATION_A, { name: "Ancien", archivedAt: CREATED_AT }),
    serviceOf(FOREIGN_ID, ORGANIZATION_B, { name: "Service de B" }),
  ];
});

describe("listServices", () => {
  it.each<OrganizationRole>(["owner", "admin", "secretary", "technician"])(
    "lets the %s list the active services of his company in creation order",
    async (role) => {
      expect(await listServices(dependencies())(actorOf(role))).toEqual([
        {
          id: SWEEPING_ID,
          name: "Ramonage",
          durationMinutes: 60,
          priceCents: 8000,
          document: "chimney_sweeping_certificate",
          trade: "chimney_sweeping",
        },
        {
          id: STOVE_ID,
          name: "Entretien poêle",
          durationMinutes: 90,
          priceCents: null,
          document: "maintenance_certificate",
          trade: "stove_maintenance",
        },
      ]);
    },
  );

  it("lists only the services of the company of the actor", async () => {
    const services = await listServices(dependencies())(
      actorOf("owner", { organizationId: ORGANIZATION_B }),
    );
    expect(services.map(({ id }) => id)).toEqual([FOREIGN_ID]);
  });

  it("lets an impersonating platform admin read the services", async () => {
    const services = await listServices(dependencies())(
      actorOf("owner", { isImpersonating: true }),
    );
    expect(services.map(({ id }) => id)).toEqual([SWEEPING_ID, STOVE_ID]);
  });

  it("returns an empty list for a company without services", async () => {
    expect(
      await listServices(dependencies())(actorOf("owner", { organizationId: "organization-c" })),
    ).toEqual([]);
  });
});

describe("createService", () => {
  it.each<OrganizationRole>(["owner", "admin"])(
    "lets the %s add a service to his company",
    async (role) => {
      const created = await createService(dependencies())(actorOf(role), NEW_SERVICE);
      expect(created).toEqual({ ...NEW_SERVICE, id: expect.any(String) });
      expect(storedById(created.id)).toMatchObject({
        ...NEW_SERVICE,
        organizationId: ORGANIZATION_A,
        archivedAt: null,
      });
    },
  );

  it("gives each new service its own identifier", async () => {
    const first = await createService(dependencies())(actorOf("owner"), NEW_SERVICE);
    const second = await createService(dependencies())(actorOf("owner"), NEW_SERVICE);
    expect(first.id).not.toBe(second.id);
  });

  it("lists a new service after the existing ones", async () => {
    const created = await createService(dependencies())(actorOf("owner"), NEW_SERVICE);
    const services = await listServices(dependencies())(actorOf("owner"));
    expect(services.map(({ id }) => id)).toEqual([SWEEPING_ID, STOVE_ID, created.id]);
  });

  it.each<OrganizationRole>(["secretary", "technician"])(
    "forbids the %s to add a service",
    async (role) => {
      await expect(createService(dependencies())(actorOf(role), NEW_SERVICE)).rejects.toThrow(
        ForbiddenError,
      );
      expect(stored).toHaveLength(4);
    },
  );

  it.each<OrganizationRole>(["owner", "admin"])(
    "refuses to add a service while impersonating a %s",
    async (role) => {
      await expect(
        createService(dependencies())(actorOf(role, { isImpersonating: true }), NEW_SERVICE),
      ).rejects.toThrow(ForbiddenError);
      expect(stored).toHaveLength(4);
    },
  );

  it("adds the service to the company of the actor only", async () => {
    const created = await createService(dependencies())(
      actorOf("owner", { organizationId: ORGANIZATION_B }),
      NEW_SERVICE,
    );
    expect(storedById(created.id)?.organizationId).toBe(ORGANIZATION_B);
    const servicesOfA = await listServices(dependencies())(actorOf("owner"));
    expect(servicesOfA.map(({ id }) => id)).not.toContain(created.id);
  });
});

describe("updateService", () => {
  it.each<OrganizationRole>(["owner", "admin"])(
    "lets the %s change the price of a service and returns it whole",
    async (role) => {
      expect(
        await updateService(dependencies())(actorOf(role), {
          serviceId: SWEEPING_ID,
          changes: { priceCents: 9500 },
        }),
      ).toEqual({
        isOk: true,
        value: {
          id: SWEEPING_ID,
          name: "Ramonage",
          durationMinutes: 60,
          priceCents: 9500,
          document: "chimney_sweeping_certificate",
          trade: "chimney_sweeping",
        },
      });
      expect(storedById(SWEEPING_ID)?.priceCents).toBe(9500);
    },
  );

  it("sets a service on quotation", async () => {
    await updateService(dependencies())(actorOf("owner"), {
      serviceId: SWEEPING_ID,
      changes: { priceCents: null },
    });
    expect(storedById(SWEEPING_ID)?.priceCents).toBeNull();
  });

  it("removes the trade of a service", async () => {
    await updateService(dependencies())(actorOf("owner"), {
      serviceId: SWEEPING_ID,
      changes: { trade: null },
    });
    expect(storedById(SWEEPING_ID)?.trade).toBeNull();
  });

  it("stamps the update time", async () => {
    await updateService(dependencies())(actorOf("owner"), {
      serviceId: SWEEPING_ID,
      changes: { name: "Ramonage bois" },
    });
    expect(storedById(SWEEPING_ID)?.updatedAt.getTime()).toBeGreaterThan(CREATED_AT.getTime());
    expect(storedById(SWEEPING_ID)?.createdAt).toEqual(CREATED_AT);
  });

  it("keeps the fields that are not changed", async () => {
    await updateService(dependencies())(actorOf("owner"), {
      serviceId: STOVE_ID,
      changes: { durationMinutes: 120 },
    });
    expect(storedById(STOVE_ID)).toMatchObject({
      name: "Entretien poêle",
      durationMinutes: 120,
      priceCents: null,
      document: "maintenance_certificate",
      trade: "stove_maintenance",
    });
  });

  it.each<OrganizationRole>(["secretary", "technician"])(
    "forbids the %s to change a service",
    async (role) => {
      await expect(
        updateService(dependencies())(actorOf(role), {
          serviceId: SWEEPING_ID,
          changes: { priceCents: 1 },
        }),
      ).rejects.toThrow(ForbiddenError);
      expect(storedById(SWEEPING_ID)?.priceCents).toBe(8000);
    },
  );

  it("refuses to change a service while impersonating", async () => {
    await expect(
      updateService(dependencies())(actorOf("owner", { isImpersonating: true }), {
        serviceId: SWEEPING_ID,
        changes: { priceCents: 1 },
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(storedById(SWEEPING_ID)?.priceCents).toBe(8000);
  });

  it.each([
    ["unknown", UNKNOWN_ID],
    ["archived", ARCHIVED_ID],
    ["another company's", FOREIGN_ID],
  ])("answers service_not_found for an %s service", async (_label, serviceId) => {
    const before = stored.map((service) => ({ ...service }));
    expect(
      await updateService(dependencies())(actorOf("owner"), {
        serviceId,
        changes: { priceCents: 1 },
      }),
    ).toEqual({ isOk: false, error: "service_not_found" });
    expect(stored).toEqual(before);
  });
});

describe("archiveService", () => {
  it.each<OrganizationRole>(["owner", "admin"])(
    "lets the %s archive a service, which leaves the list",
    async (role) => {
      expect(
        await archiveService(dependencies())(actorOf(role), { serviceId: SWEEPING_ID }),
      ).toEqual({ isOk: true, value: undefined });
      expect(storedById(SWEEPING_ID)?.archivedAt).toBeInstanceOf(Date);
      const services = await listServices(dependencies())(actorOf(role));
      expect(services.map(({ id }) => id)).toEqual([STOVE_ID]);
    },
  );

  it("keeps the archived service in storage", async () => {
    await archiveService(dependencies())(actorOf("owner"), { serviceId: SWEEPING_ID });
    expect(stored).toHaveLength(4);
  });

  it.each<OrganizationRole>(["secretary", "technician"])(
    "forbids the %s to archive a service",
    async (role) => {
      await expect(
        archiveService(dependencies())(actorOf(role), { serviceId: SWEEPING_ID }),
      ).rejects.toThrow(ForbiddenError);
      expect(storedById(SWEEPING_ID)?.archivedAt).toBeNull();
    },
  );

  it("refuses to archive a service while impersonating", async () => {
    await expect(
      archiveService(dependencies())(actorOf("admin", { isImpersonating: true }), {
        serviceId: SWEEPING_ID,
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(storedById(SWEEPING_ID)?.archivedAt).toBeNull();
  });

  it("answers service_not_found for an unknown service", async () => {
    expect(
      await archiveService(dependencies())(actorOf("owner"), { serviceId: UNKNOWN_ID }),
    ).toEqual({ isOk: false, error: "service_not_found" });
  });

  it("answers service_not_found for a service already archived", async () => {
    expect(
      await archiveService(dependencies())(actorOf("owner"), { serviceId: ARCHIVED_ID }),
    ).toEqual({ isOk: false, error: "service_not_found" });
    expect(storedById(ARCHIVED_ID)?.archivedAt).toEqual(CREATED_AT);
  });

  it("answers service_not_found for a service of another company and leaves it active", async () => {
    expect(
      await archiveService(dependencies())(actorOf("owner"), { serviceId: FOREIGN_ID }),
    ).toEqual({ isOk: false, error: "service_not_found" });
    expect(storedById(FOREIGN_ID)?.archivedAt).toBeNull();
  });
});
