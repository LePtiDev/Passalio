import type { ProspectCompanyFileResponse } from "@passalio/shared";
import { useCallback, useMemo, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { AdminPage, useNow, type AdminTrailStep } from "@/contexts/backoffice";
import { DESKTOP_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { salesFr } from "../../fr";
import { isMissingRecord, useCompanyFile } from "../../hooks/use-sales-queries";
import { ContactFormDialog } from "../forms/contact-form-dialog";
import { CompanyFormDialog } from "../forms/company-form-dialog";
import { SECTION_TITLE_CLASS } from "../sales-styles";
import { callablePhoneOf } from "./company-facts";
import { CompanyContacts } from "./company-contacts";
import { CompanyFileHeader } from "./company-file-header";
import { CompanyAddress, CompanyInformation } from "./company-information";
import { CompanyMapCard } from "./company-map-card";
import { FileSkeleton, RecordNotFound } from "./file-states";
import { HistoryCard } from "./history-card";

const text = salesFr.file;

const BACK = { to: "/admin/entreprises", label: text.back } as const;

const CompanyFile = ({ file }: { readonly file: ProspectCompanyFileResponse }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const edit = useCallback(() => setIsEditing(true), []);
  const addContact = useCallback(() => setIsAddingContact(true), []);
  const now = useNow();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { company, contacts, events } = file;
  const phone = callablePhoneOf(file);
  return (
    <>
      <CompanyFileHeader company={company} phone={phone} now={now} onEdit={edit} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-3">
          <CompanyContacts contacts={contacts} onAdd={addContact} />
          <div className="lg:hidden">
            <CompanyInformation company={company} phone={phone} />
          </div>
          <h2 className={`${SECTION_TITLE_CLASS} lg:mt-2`}>{salesFr.history.title}</h2>
          <HistoryCard
            companyId={company.id}
            contactId={null}
            events={events}
            isContactShown
            now={now}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="hidden lg:block">
            <CompanyInformation company={company} phone={phone} />
          </div>
          {isDesktop ? <CompanyMapCard company={company} /> : <CompanyAddress company={company} />}
        </div>
      </div>
      <CompanyFormDialog company={company} isOpen={isEditing} onOpenChange={setIsEditing} />
      <ContactFormDialog
        companyId={company.id}
        contact={null}
        isOpen={isAddingContact}
        onOpenChange={setIsAddingContact}
      />
    </>
  );
};

export const CompanyFileScreen = ({ companyId }: { readonly companyId: string }) => {
  const file = useCompanyFile(companyId);
  const { refetch } = file;
  const retry = useCallback(() => void refetch(), [refetch]);
  const name = file.data?.company.name ?? salesFr.companies.title;
  const trail = useMemo<readonly AdminTrailStep[]>(
    () => [{ label: salesFr.companies.title, to: "/admin/entreprises" }, { label: name }],
    [name],
  );
  return (
    <AdminPage section="commercial" trail={trail} mobileTitle={name} mobileBack={BACK}>
      {file.isPending ? <FileSkeleton /> : null}
      {file.isError && isMissingRecord(file.error) ? (
        <RecordNotFound to="/admin/entreprises" />
      ) : null}
      {file.isError && !isMissingRecord(file.error) ? (
        <ErrorState error={file.error} onRetry={retry} />
      ) : null}
      {file.isSuccess ? <CompanyFile file={file.data} /> : null}
    </AdminPage>
  );
};
