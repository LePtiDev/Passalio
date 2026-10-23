import type { ProspectEventKind, ProspectStage } from "@passalio/shared";

export type ProspectCompany = {
  readonly id: string;
  readonly name: string;
  readonly searchName: string;
  readonly searchText: string;
  readonly legalName: string | null;
  readonly siren: string | null;
  readonly nafCode: string | null;
  readonly legalForm: string | null;
  readonly address: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly department: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly activity: string | null;
  readonly headcount: string | null;
  readonly foundedOn: string | null;
  readonly registryStatus: string | null;
  readonly notes: string | null;
  readonly stage: ProspectStage;
  readonly ownerUserId: string | null;
  readonly sourceRef: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProspectContact = {
  readonly id: string;
  readonly companyId: string;
  readonly firstName: string | null;
  readonly lastName: string;
  readonly searchName: string;
  readonly jobTitle: string | null;
  readonly isLeader: boolean;
  readonly isMain: boolean;
  readonly phone: string | null;
  readonly mobile: string | null;
  readonly email: string | null;
  readonly bestTime: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProspectEvent = {
  readonly id: string;
  readonly companyId: string;
  readonly contactId: string | null;
  readonly authorUserId: string | null;
  readonly kind: ProspectEventKind;
  readonly body: string | null;
  readonly fromStage: ProspectStage | null;
  readonly toStage: ProspectStage | null;
  readonly createdAt: Date;
};

export type Person = { readonly id: string; readonly name: string };

export type CompanyRow = Pick<
  ProspectCompany,
  "id" | "name" | "searchName" | "city" | "department" | "phone" | "stage"
> & { readonly owner: Person | null; readonly mainContact: Person | null };

export type ContactRow = Pick<
  ProspectContact,
  "id" | "firstName" | "lastName" | "searchName" | "jobTitle" | "isLeader" | "email"
> & {
  readonly phone: string | null;
  readonly company: Pick<ProspectCompany, "id" | "name" | "city" | "department">;
};

export type EventRow = ProspectEvent & {
  readonly authorName: string | null;
  readonly contact: Person | null;
};

export type MapPin = Pick<ProspectCompany, "id" | "name" | "city" | "phone" | "stage"> & {
  readonly latitude: number;
  readonly longitude: number;
};
