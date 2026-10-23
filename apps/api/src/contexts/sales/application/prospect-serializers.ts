import type {
  ProspectCompanyResponse,
  ProspectCompanySummaryResponse,
  ProspectContactResponse,
  ProspectEventResponse,
} from "@passalio/shared";
import type {
  CompanyRow,
  EventRow,
  Person,
  ProspectCompany,
  ProspectContact,
} from "../domain/prospect-models";
import { contactNameOf } from "../domain/prospect-rules";

export const companySummaryResponse = ({
  searchName: _searchName,
  ...row
}: CompanyRow): ProspectCompanySummaryResponse => row;

export const companyResponse = (
  {
    searchName: _searchName,
    searchText: _searchText,
    sourceRef: _sourceRef,
    ownerUserId: _ownerUserId,
    ...company
  }: ProspectCompany,
  owner: Person | null,
): ProspectCompanyResponse => ({
  ...company,
  owner,
  createdAt: company.createdAt.toISOString(),
  updatedAt: company.updatedAt.toISOString(),
});

export const contactResponse = ({
  searchName: _searchName,
  createdAt: _createdAt,
  updatedAt: _updatedAt,
  ...contact
}: ProspectContact): ProspectContactResponse => ({ ...contact, name: contactNameOf(contact) });

export const eventResponse = (event: EventRow): ProspectEventResponse => ({
  id: event.id,
  kind: event.kind,
  body: event.body,
  fromStage: event.fromStage,
  toStage: event.toStage,
  createdAt: event.createdAt.toISOString(),
  authorName: event.authorName,
  contact: event.contact,
});
