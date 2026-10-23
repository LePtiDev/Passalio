import { BACKOFFICE_QUERIES } from "./backoffice-queries";
import type { CatalogedQuery } from "./cataloged-query";
import { CUSTOMER_QUERIES } from "./customer-queries";
import { IDENTITY_QUERIES } from "./identity-queries";
import { PLATFORM_QUERIES } from "./platform-queries";
import { PROSPECT_COMPANY_QUERIES } from "./prospect-company-queries";
import { PROSPECT_CONTACT_QUERIES } from "./prospect-contact-queries";

export const QUERY_CATALOG: readonly CatalogedQuery[] = [
  ...CUSTOMER_QUERIES,
  ...IDENTITY_QUERIES,
  ...PLATFORM_QUERIES,
  ...BACKOFFICE_QUERIES,
  ...PROSPECT_COMPANY_QUERIES,
  ...PROSPECT_CONTACT_QUERIES,
];
