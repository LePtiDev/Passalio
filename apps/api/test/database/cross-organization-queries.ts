const ID_COLLISION_CHECK = "an id is unique across every organization, not only inside one";
const ARCHIVE_JOB = "the archive job runs for every organization and filters each write by it";
const PASSALIO_BACK_OFFICE = "the Passalio back office reads every account on purpose";

export const CROSS_ORGANIZATION_QUERIES: Readonly<Record<string, string>> = {
  "customers.exists: customer id already used": ID_COLLISION_CHECK,
  "sites.exists: site id already used": ID_COLLISION_CHECK,
  "equipments.exists: equipment id already used": ID_COLLISION_CHECK,
  "photos.exists: photo id already used": ID_COLLISION_CHECK,
  "interventions.exists: intervention id already used": ID_COLLISION_CHECK,
  "documents.exists: document id already used": ID_COLLISION_CHECK,
  "pdfArchives.pending: signed certificates whose PDF is not archived yet": ARCHIVE_JOB,
  "backofficeAccounts.countAccounts: account counters of the overview": PASSALIO_BACK_OFFICE,
  "backofficeAccounts.listAccounts: accounts list filtered by all": PASSALIO_BACK_OFFICE,
  "backofficeAccounts.listAccounts: accounts list filtered by trial": PASSALIO_BACK_OFFICE,
  "backofficeAccounts.listAccounts: accounts list filtered by dropping": PASSALIO_BACK_OFFICE,
  "backofficeAccounts.countActivePeople: active people of the overview": PASSALIO_BACK_OFFICE,
  "backofficeJournal.journal: platform journal filtered by actions": PASSALIO_BACK_OFFICE,
  "pendingInvitations.hasPendingInvitation: pending company or team invitation of a person who signs up while sign-up is closed":
    "a person who signs up belongs to no organization yet",
};

export const isCrossOrganizationQuery = (name: string) =>
  Object.hasOwn(CROSS_ORGANIZATION_QUERIES, name);
