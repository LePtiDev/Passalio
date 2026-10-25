import { normalizeSearchText } from "@passalio/shared";
import type {
  CompanyRow,
  ContactRow,
  EventRow,
  Person,
  ProspectCompany,
  ProspectContact,
  ProspectEvent,
} from "../domain/prospect-models";
import type { ProspectCall, ProspectFollowUp, ProspectTask } from "../domain/call-models";
import type { NameCursor, SalesDependencies } from "../domain/prospect-ports";
import { createInMemoryCallRepositories } from "./in-memory-call-repositories";
import {
  companySearchName,
  companySearchText,
  contactNameOf,
  contactSearchName,
  withChanges,
} from "../domain/prospect-rules";

export type InMemorySalesState = {
  readonly companies: ProspectCompany[];
  readonly contacts: ProspectContact[];
  readonly events: ProspectEvent[];
  readonly calls: ProspectCall[];
  readonly followUps: ProspectFollowUp[];
  readonly tasks: ProspectTask[];
  readonly people: Person[];
  readonly deletedCompanies: { readonly actorUserId: string; readonly companyId: string }[];
  readonly websiteTaskIds: string[];
};

export const createInMemorySalesState = (): InMemorySalesState => ({
  companies: [],
  contacts: [],
  events: [],
  calls: [],
  followUps: [],
  tasks: [],
  people: [],
  deletedCompanies: [],
  websiteTaskIds: [],
});

const CREATED_AT = new Date("2026-01-01T00:00:00Z");

export const inMemoryCompany = (
  company: Pick<ProspectCompany, "id" | "name"> & Partial<ProspectCompany>,
): ProspectCompany => ({
  searchName: companySearchName(company.name),
  searchText: companySearchText({
    name: company.name,
    city: company.city,
    postalCode: company.postalCode,
    siren: company.siren,
  }),
  legalName: null,
  siren: null,
  nafCode: null,
  legalForm: null,
  address: null,
  postalCode: null,
  city: null,
  department: "75",
  latitude: null,
  longitude: null,
  phone: null,
  email: null,
  website: null,
  activity: null,
  headcount: null,
  currentTool: null,
  foundedOn: null,
  registryStatus: null,
  notes: null,
  stage: "to_qualify",
  ownerUserId: null,
  sourceRef: null,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...company,
});

export const inMemoryContact = (
  contact: Pick<ProspectContact, "id" | "companyId" | "lastName"> & Partial<ProspectContact>,
): ProspectContact => ({
  firstName: null,
  searchName: contactSearchName({
    firstName: contact.firstName ?? null,
    lastName: contact.lastName,
  }),
  jobTitle: null,
  isLeader: false,
  isMain: false,
  phone: null,
  mobile: null,
  email: null,
  bestTime: null,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
  ...contact,
});

const byName = (first: NameCursor, second: NameCursor) =>
  first.searchName === second.searchName
    ? first.id.localeCompare(second.id)
    : first.searchName.localeCompare(second.searchName);

const isAfter = (after: NameCursor | undefined) => (row: NameCursor) =>
  after === undefined || byName(row, after) > 0;

const replaceById = <Item extends { readonly id: string }>(
  items: Item[],
  id: string,
  update: (item: Item) => Item,
) => {
  items.forEach((item, index) => {
    if (item.id === id) {
      items[index] = update(item);
    }
  });
};

const inScope =
  (department: string | undefined, ownerUserId: string | undefined) => (company: ProspectCompany) =>
    (department === undefined || company.department === department) &&
    (ownerUserId === undefined || company.ownerUserId === ownerUserId);

const removeWhere = <Item>(items: Item[], isRemoved: (item: Item) => boolean) => {
  const kept = items.filter((item) => !isRemoved(item));
  items.splice(0, items.length, ...kept);
};

export const createInMemorySalesDependencies = (
  state: InMemorySalesState,
  now: () => Date,
  newId: () => string,
): SalesDependencies => {
  const personOf = (userId: string | null) => state.people.find(({ id }) => id === userId) ?? null;
  const contactPersonOf = (contactId: string | null) => {
    const contact = state.contacts.find(({ id }) => id === contactId);
    return contact === undefined ? null : { id: contact.id, name: contactNameOf(contact) };
  };
  const mainContactOf = (companyId: string) => {
    const [main] = state.contacts
      .filter((contact) => contact.companyId === companyId)
      .toSorted(
        (first, second) =>
          Number(second.isMain) - Number(first.isMain) ||
          Number(second.isLeader) - Number(first.isLeader) ||
          first.createdAt.getTime() - second.createdAt.getTime(),
      );
    return main === undefined ? null : { id: main.id, name: contactNameOf(main) };
  };
  const rowOf = (company: ProspectCompany): CompanyRow => ({
    id: company.id,
    name: company.name,
    searchName: company.searchName,
    city: company.city,
    department: company.department,
    phone: company.phone,
    stage: company.stage,
    owner: personOf(company.ownerUserId),
    mainContact: mainContactOf(company.id),
  });
  const companyOf = (contact: ProspectContact) =>
    state.companies.find(({ id }) => id === contact.companyId);
  const inDepartment = (department: string | undefined) => (contact: ProspectContact) =>
    department === undefined || companyOf(contact)?.department === department;
  const hasNoPhone = (contact: ProspectContact) =>
    contact.phone === null &&
    contact.mobile === null &&
    (companyOf(contact)?.phone ?? null) === null;
  const eventRowOf = (event: ProspectEvent): EventRow => ({
    ...event,
    authorName: personOf(event.authorUserId)?.name ?? null,
    contact: contactPersonOf(event.contactId),
  });
  const newestEvents = (isIncluded: (event: ProspectEvent) => boolean, limit: number) =>
    state.events
      .filter(isIncluded)
      .toSorted(
        (first, second) =>
          second.createdAt.getTime() - first.createdAt.getTime() ||
          second.id.localeCompare(first.id),
      )
      .slice(0, limit)
      .map(eventRowOf);

  return {
    companies: {
      create: async (company) => {
        state.companies.push(company);
      },
      findById: async (companyId) => state.companies.find(({ id }) => id === companyId),
      findByPhone: async (phone) =>
        state.companies.find((company) => company.phone === phone) ??
        state.companies.find(({ id }) =>
          state.contacts.some(
            (contact) =>
              contact.companyId === id && (contact.phone === phone || contact.mobile === phone),
          ),
        ),
      update: async (companyId, changes) =>
        replaceById(state.companies, companyId, (company) => withChanges(company, changes)),
      changeStage: async (companyId, stage, event) => {
        replaceById(state.companies, companyId, (company) => ({ ...company, stage }));
        state.events.push(event);
      },
      delete: async (companyId) => {
        removeWhere(state.companies, ({ id }) => id === companyId);
        removeWhere(state.contacts, (contact) => contact.companyId === companyId);
        removeWhere(state.events, (event) => event.companyId === companyId);
        removeWhere(state.calls, (call) => call.companyId === companyId);
        removeWhere(state.followUps, (followUp) => followUp.companyId === companyId);
        removeWhere(state.tasks, (task) => task.companyId === companyId);
      },
      list: async ({ department, ownerUserId, stage, query, after, limit }) =>
        state.companies
          .filter(inScope(department, ownerUserId))
          .filter((company) => stage === undefined || company.stage === stage)
          .filter(
            (company) =>
              query === undefined || company.searchText.includes(normalizeSearchText(query)),
          )
          .map(rowOf)
          .toSorted(byName)
          .filter(isAfter(after))
          .slice(0, limit),
      countByStage: async ({ department, ownerUserId }) => {
        const scoped = state.companies.filter(inScope(department, ownerUserId));
        return [...new Set(scoped.map(({ stage }) => stage))].map((stage) => ({
          stage,
          count: scoped.filter((company) => company.stage === stage).length,
        }));
      },
      summaryOf: async (companyId) => {
        const company = state.companies.find(({ id }) => id === companyId);
        return company === undefined ? undefined : rowOf(company);
      },
      pins: async (department, stage) =>
        state.companies
          .filter(inScope(department, undefined))
          .filter((company) => stage === undefined || company.stage === stage)
          .flatMap(({ id, name, city, phone, stage: companyStage, latitude, longitude }) =>
            latitude === null || longitude === null
              ? []
              : [{ id, name, city, phone, stage: companyStage, latitude, longitude }],
          ),
      departments: async () =>
        [...new Set(state.companies.map(({ department }) => department))]
          .toSorted()
          .map((code) => ({
            code,
            count: state.companies.filter(({ department }) => department === code).length,
          })),
    },
    contacts: {
      create: async (contact) => {
        state.contacts.push(contact);
      },
      findById: async (contactId) => state.contacts.find(({ id }) => id === contactId),
      update: async (contactId, changes) =>
        replaceById(state.contacts, contactId, (contact) => withChanges(contact, changes)),
      delete: async (contactId) => removeWhere(state.contacts, ({ id }) => id === contactId),
      listByCompany: async (companyId) =>
        state.contacts.filter((contact) => contact.companyId === companyId),
      list: async ({ filter, department, query, after, limit }) =>
        state.contacts
          .filter(inDepartment(department))
          .filter((contact) => filter !== "leaders" || contact.isLeader)
          .filter((contact) => filter !== "no_phone" || hasNoPhone(contact))
          .filter(
            (contact) =>
              query === undefined ||
              contact.searchName.includes(normalizeSearchText(query)) ||
              (companyOf(contact)?.searchName.includes(normalizeSearchText(query)) ?? false),
          )
          .toSorted(byName)
          .filter(isAfter(after))
          .slice(0, limit)
          .flatMap((contact): ContactRow[] => {
            const company = companyOf(contact);
            return company === undefined
              ? []
              : [
                  {
                    id: contact.id,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    searchName: contact.searchName,
                    jobTitle: contact.jobTitle,
                    isLeader: contact.isLeader,
                    email: contact.email,
                    phone: contact.phone ?? contact.mobile ?? company.phone,
                    company: {
                      id: company.id,
                      name: company.name,
                      city: company.city,
                      department: company.department,
                    },
                  },
                ];
          }),
      counts: async (department) => {
        const scoped = state.contacts.filter(inDepartment(department));
        return {
          all: scoped.length,
          leaders: scoped.filter(({ isLeader }) => isLeader).length,
          no_phone: scoped.filter(hasNoPhone).length,
        };
      },
    },
    events: {
      add: async (event) => {
        state.events.push(event);
      },
      ofCompany: async (companyId, limit) =>
        newestEvents((event) => event.companyId === companyId, limit),
      ofContact: async (contactId, limit) =>
        newestEvents((event) => event.contactId === contactId, limit),
    },
    ...createInMemoryCallRepositories(state, { personOf, contactPersonOf, mainContactOf }),
    people: {
      owners: async () =>
        state.people.toSorted((first, second) => first.name.localeCompare(second.name)),
      isOwner: async (userId) => state.people.some(({ id }) => id === userId),
    },
    audit: {
      companyDeleted: async (actorUserId, companyId) => {
        state.deletedCompanies.push({ actorUserId, companyId });
      },
    },
    now,
    newId,
  };
};
