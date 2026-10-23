import type { ContactFilter, ProspectStage } from "@passalio/shared";
import type {
  CompanyRow,
  ContactRow,
  EventRow,
  MapPin,
  Person,
  ProspectCompany,
  ProspectContact,
  ProspectEvent,
} from "./prospect-models";

export type NameCursor = { readonly searchName: string; readonly id: string };

export type CompanyScope = {
  readonly department: string | undefined;
  readonly ownerUserId: string | undefined;
};

export type CompanyPageRequest = CompanyScope & {
  readonly stage: ProspectStage | undefined;
  readonly query: string | undefined;
  readonly after: NameCursor | undefined;
  readonly limit: number;
};

export type ContactPageRequest = {
  readonly filter: ContactFilter;
  readonly department: string | undefined;
  readonly query: string | undefined;
  readonly after: NameCursor | undefined;
  readonly limit: number;
};

type Editable<Record> = {
  readonly [Key in keyof Omit<Record, "id" | "createdAt">]?: Record[Key] | undefined;
};

export type CompanyRepository = {
  readonly create: (company: ProspectCompany) => Promise<void>;
  readonly findById: (companyId: string) => Promise<ProspectCompany | undefined>;
  readonly update: (companyId: string, changes: Editable<ProspectCompany>) => Promise<void>;
  readonly changeStage: (
    companyId: string,
    stage: ProspectStage,
    event: ProspectEvent,
  ) => Promise<void>;
  readonly delete: (companyId: string) => Promise<void>;
  readonly list: (request: CompanyPageRequest) => Promise<readonly CompanyRow[]>;
  readonly countByStage: (
    scope: CompanyScope,
  ) => Promise<readonly { readonly stage: ProspectStage; readonly count: number }[]>;
  readonly summaryOf: (companyId: string) => Promise<CompanyRow | undefined>;
  readonly pins: (
    department: string | undefined,
    stage: ProspectStage | undefined,
  ) => Promise<readonly MapPin[]>;
  readonly departments: () => Promise<readonly { readonly code: string; readonly count: number }[]>;
};

export type ContactRepository = {
  readonly create: (contact: ProspectContact) => Promise<void>;
  readonly findById: (contactId: string) => Promise<ProspectContact | undefined>;
  readonly update: (contactId: string, changes: Editable<ProspectContact>) => Promise<void>;
  readonly delete: (contactId: string) => Promise<void>;
  readonly listByCompany: (companyId: string) => Promise<readonly ProspectContact[]>;
  readonly list: (request: ContactPageRequest) => Promise<readonly ContactRow[]>;
  readonly counts: (
    department: string | undefined,
  ) => Promise<{ readonly [Filter in ContactFilter]: number }>;
};

export type EventRepository = {
  readonly add: (event: ProspectEvent) => Promise<void>;
  readonly ofCompany: (companyId: string, limit: number) => Promise<readonly EventRow[]>;
  readonly ofContact: (contactId: string, limit: number) => Promise<readonly EventRow[]>;
};

export type PlatformPeople = {
  readonly owners: () => Promise<readonly Person[]>;
  readonly isOwner: (userId: string) => Promise<boolean>;
};

export type DeletionAudit = {
  readonly companyDeleted: (actorUserId: string, companyId: string) => Promise<void>;
};

export type SalesDependencies = {
  readonly companies: CompanyRepository;
  readonly contacts: ContactRepository;
  readonly events: EventRepository;
  readonly people: PlatformPeople;
  readonly audit: DeletionAudit;
  readonly now: () => Date;
  readonly newId: () => string;
};
