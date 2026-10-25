import { BACKOFFICE_QUERIES } from "./backoffice-queries";
import type { CatalogedQuery } from "./cataloged-query";
import { COMPLIANCE_QUERIES } from "./compliance-queries";
import { CUSTOMER_QUERIES } from "./customer-queries";
import { IDENTITY_QUERIES } from "./identity-queries";
import { MAIL_SETTINGS_QUERIES } from "./mail-settings-queries";
import { PLATE_READING_QUERIES } from "./plate-reading-queries";
import { PLATFORM_QUERIES } from "./platform-queries";
import { PROSPECT_CALL_QUERIES } from "./prospect-call-queries";
import { PROSPECT_COMPANY_QUERIES } from "./prospect-company-queries";
import { PROSPECT_CONTACT_QUERIES } from "./prospect-contact-queries";
import { REMINDER_QUERIES } from "./reminder-queries";
import { SCHEDULING_QUERIES } from "./scheduling-queries";

export const QUERY_CATALOG: readonly CatalogedQuery[] = [
  ...CUSTOMER_QUERIES,
  ...PLATE_READING_QUERIES,
  ...IDENTITY_QUERIES,
  ...PLATFORM_QUERIES,
  ...BACKOFFICE_QUERIES,
  ...PROSPECT_COMPANY_QUERIES,
  ...PROSPECT_CONTACT_QUERIES,
  ...PROSPECT_CALL_QUERIES,
  ...MAIL_SETTINGS_QUERIES,
  ...REMINDER_QUERIES,
  ...SCHEDULING_QUERIES,
  ...COMPLIANCE_QUERIES,
];
