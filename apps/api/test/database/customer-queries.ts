import { newId } from "@passalio/shared";
import { PAGE, type CatalogedQuery } from "./cataloged-query";
import { aCustomer, anEquipment, aPhoto, aSite, AT, LATER } from "./domain-fixtures";

const CURSOR = { updatedAt: AT, id: newId() };

const changeFeedQueries = (["customers", "sites", "equipments", "photos"] as const).flatMap(
  (feed): CatalogedQuery[] => [
    {
      method: `changes.${feed}`,
      query: `first sync page of ${feed}`,
      run: (r, s) => r.changes[feed](s.organization.id, undefined, PAGE),
    },
    {
      method: `changes.${feed}`,
      query: `next sync page of ${feed} after a cursor`,
      run: (r, s) => r.changes[feed](s.organization.id, CURSOR, PAGE),
    },
  ],
);

export const CUSTOMER_QUERIES: readonly CatalogedQuery[] = [
  {
    method: "customers.exists",
    query: "customer id already used",
    run: (r, s) => r.customers.exists(s.customer.id),
  },
  {
    method: "customers.existsInOrganization",
    query: "customer of the organization",
    run: (r, s) => r.customers.existsInOrganization(s.organization.id, s.customer.id),
  },
  {
    method: "customers.create",
    query: "create a customer with its first site",
    run: async (r, s) => {
      const customer = aCustomer(s.organization.id, s.owner.id);
      await r.customers.create(customer, aSite(s.organization.id, customer.id));
    },
  },
  {
    method: "customers.findById",
    query: "customer file header",
    run: (r, s) => r.customers.findById(s.organization.id, s.customer.id),
  },
  {
    method: "customers.update",
    query: "update a customer",
    run: (r, s) =>
      r.customers.update(s.organization.id, s.customer.id, {
        phone: "0622334455",
        updatedAt: LATER,
      }),
  },
  {
    method: "customers.archive",
    query: "archive a customer with its sites, equipments and photos",
    run: async (r, s) => {
      const customer = aCustomer(s.organization.id, s.owner.id);
      const site = aSite(s.organization.id, customer.id);
      const equipment = anEquipment(s.organization.id, site.id);
      await r.customers.create(customer, site);
      await r.equipments.create(equipment);
      await r.photos.create(aPhoto(s.organization.id, equipment.id, s.owner.id));
      await r.customers.archive(s.organization.id, customer.id, LATER);
    },
  },
  {
    method: "customers.list",
    query: "first page of customers",
    run: (r, s) => r.customers.list(s.organization.id, { limit: PAGE }),
  },
  {
    method: "customers.list",
    query: "next page of customers in a letter range",
    run: (r, s) =>
      r.customers.list(s.organization.id, {
        limit: PAGE,
        after: { searchName: "lefevre camille", id: s.customer.id },
        range: { from: "l", to: "m" },
      }),
  },
  {
    method: "sites.exists",
    query: "site id already used",
    run: (r, s) => r.sites.exists(s.site.id),
  },
  {
    method: "sites.existsInOrganization",
    query: "site of the organization",
    run: (r, s) => r.sites.existsInOrganization(s.organization.id, s.site.id),
  },
  {
    method: "sites.create",
    query: "add a site",
    run: (r, s) => r.sites.create(aSite(s.organization.id, s.customer.id)),
  },
  {
    method: "sites.findById",
    query: "find a site",
    run: (r, s) => r.sites.findById(s.organization.id, s.site.id),
  },
  {
    method: "sites.update",
    query: "update a site",
    run: (r, s) =>
      r.sites.update(s.organization.id, s.site.id, { city: "Villeurbanne", updatedAt: LATER }),
  },
  {
    method: "sites.listByCustomer",
    query: "sites of a customer file",
    run: (r, s) => r.sites.listByCustomer(s.organization.id, s.customer.id),
  },
  {
    method: "equipments.exists",
    query: "equipment id already used",
    run: (r, s) => r.equipments.exists(s.equipment.id),
  },
  {
    method: "equipments.existsInOrganization",
    query: "equipment of the organization",
    run: (r, s) => r.equipments.existsInOrganization(s.organization.id, s.equipment.id),
  },
  {
    method: "equipments.create",
    query: "add an equipment",
    run: (r, s) => r.equipments.create(anEquipment(s.organization.id, s.site.id)),
  },
  {
    method: "equipments.create",
    query: "replace an equipment",
    run: async (r, s) => {
      const replaced = anEquipment(s.organization.id, s.site.id);
      await r.equipments.create(replaced);
      await r.equipments.create(anEquipment(s.organization.id, s.site.id), {
        replaced,
        removedOn: "2026-10-22",
      });
    },
  },
  {
    method: "equipments.findById",
    query: "find an equipment",
    run: (r, s) => r.equipments.findById(s.organization.id, s.equipment.id),
  },
  {
    method: "equipments.update",
    query: "update an equipment",
    run: (r, s) =>
      r.equipments.update(s.organization.id, s.equipment.id, { room: "Garage", updatedAt: LATER }),
  },
  {
    method: "equipments.listBySites",
    query: "equipments of a customer file",
    run: (r, s) => r.equipments.listBySites(s.organization.id, [s.site.id, newId()]),
  },
  {
    method: "photos.exists",
    query: "photo id already used",
    run: (r, s) => r.photos.exists(s.photo.id),
  },
  {
    method: "photos.create",
    query: "add a photo",
    run: (r, s) => r.photos.create(aPhoto(s.organization.id, s.equipment.id, s.technician.id)),
  },
  {
    method: "photos.findById",
    query: "find a photo to download it",
    run: (r, s) => r.photos.findById(s.organization.id, s.photo.id),
  },
  {
    method: "photos.listByEquipments",
    query: "photos of a customer file",
    run: (r, s) => r.photos.listByEquipments(s.organization.id, [s.equipment.id, newId()]),
  },
  {
    method: "organizationTrades.of",
    query: "trades of the organization",
    run: (r, s) => r.organizationTrades.of(s.organization.id),
  },
  ...changeFeedQueries,
];
