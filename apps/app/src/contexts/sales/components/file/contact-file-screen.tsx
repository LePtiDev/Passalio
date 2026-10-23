import type { ProspectContactFileResponse } from "@passalio/shared";
import { useCallback, useMemo, useState } from "react";
import { ErrorState } from "@/components/error-state";
import { AdminPage, useNow, type AdminTrailStep } from "@/contexts/backoffice";
import { salesFr } from "../../fr";
import { isMissingRecord, useContactFile } from "../../hooks/use-sales-queries";
import { ContactFormDialog } from "../forms/contact-form-dialog";
import { SECTION_TITLE_CLASS } from "../sales-styles";
import { ContactCompanyCard, ContactDetails, ContactFileHeader } from "./contact-file-parts";
import { FileSkeleton, RecordNotFound } from "./file-states";
import { HistoryCard } from "./history-card";

const text = salesFr.file;

const BACK = { to: "/admin/contacts", label: text.backToContacts } as const;

const ContactFile = ({ file }: { readonly file: ProspectContactFileResponse }) => {
  const [isEditing, setIsEditing] = useState(false);
  const edit = useCallback(() => setIsEditing(true), []);
  const now = useNow();
  const { contact, company, events } = file;
  return (
    <>
      <ContactFileHeader contact={contact} company={company} onEdit={edit} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <div className="flex flex-col gap-4 lg:gap-3">
          <div className="lg:hidden">
            <ContactDetails contact={contact} />
          </div>
          <h2 className={`${SECTION_TITLE_CLASS} hidden lg:block`}>{text.company}</h2>
          <ContactCompanyCard company={company} />
          <h2 className={`${SECTION_TITLE_CLASS} lg:mt-2`}>{salesFr.history.title}</h2>
          <HistoryCard
            companyId={company.id}
            contactId={contact.id}
            events={events}
            isContactShown={false}
            now={now}
          />
        </div>
        <div className="hidden lg:block">
          <ContactDetails contact={contact} />
        </div>
      </div>
      <ContactFormDialog
        companyId={company.id}
        contact={contact}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
      />
    </>
  );
};

export const ContactFileScreen = ({ contactId }: { readonly contactId: string }) => {
  const file = useContactFile(contactId);
  const { refetch } = file;
  const retry = useCallback(() => void refetch(), [refetch]);
  const name = file.data?.contact.name ?? salesFr.contacts.title;
  const trail = useMemo<readonly AdminTrailStep[]>(
    () => [{ label: salesFr.contacts.title, to: "/admin/contacts" }, { label: name }],
    [name],
  );
  return (
    <AdminPage section="commercial" trail={trail} mobileTitle={name} mobileBack={BACK}>
      {file.isPending ? <FileSkeleton /> : null}
      {file.isError && isMissingRecord(file.error) ? <RecordNotFound to="/admin/contacts" /> : null}
      {file.isError && !isMissingRecord(file.error) ? (
        <ErrorState error={file.error} onRetry={retry} />
      ) : null}
      {file.isSuccess ? <ContactFile file={file.data} /> : null}
    </AdminPage>
  );
};
