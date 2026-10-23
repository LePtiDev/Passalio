import { CONTACT_FILTERS, DEPARTMENT_PATTERN, PROSPECT_STAGES } from "@passalio/shared";
import { createRoute } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import * as z from "zod";
import {
  CompaniesScreen,
  CompanyFileScreen,
  ContactFileScreen,
  ContactsScreen,
  type CompanyListScope,
  type ContactListScope,
} from "@/contexts/sales";
import { textParam } from "@/lib/search-params";
import { adminShellRoute } from "./admin";

const department = textParam(z.string().regex(DEPARTMENT_PATTERN)).optional();
const search = textParam(z.string().max(120)).optional();

const emptyAsUndefined = <Value extends string>(value: Value | null | undefined) =>
  value === null || value === "" ? undefined : value;

const companiesSearch = z.object({
  etape: z.enum(PROSPECT_STAGES).optional(),
  departement: department,
  suivi: textParam(z.string().max(100)).optional(),
  recherche: search,
});

export const adminCompaniesRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/entreprises",
  validateSearch: companiesSearch,
  component: function AdminCompaniesRouteScreen() {
    const { etape, departement, suivi, recherche } = adminCompaniesRoute.useSearch();
    const navigate = adminCompaniesRoute.useNavigate();
    const scope = useMemo<CompanyListScope>(
      () => ({
        stage: etape ?? null,
        department: departement ?? null,
        owner: suivi ?? null,
        search: recherche ?? "",
      }),
      [etape, departement, suivi, recherche],
    );
    const changeScope = useCallback(
      (changes: Partial<CompanyListScope>) =>
        void navigate({
          search: (previous) => ({
            ...previous,
            ...("stage" in changes ? { etape: emptyAsUndefined(changes.stage) } : {}),
            ...("department" in changes
              ? { departement: emptyAsUndefined(changes.department) }
              : {}),
            ...("owner" in changes ? { suivi: emptyAsUndefined(changes.owner) } : {}),
            ...("search" in changes ? { recherche: emptyAsUndefined(changes.search) } : {}),
          }),
          replace: true,
        }),
      [navigate],
    );
    return <CompaniesScreen scope={scope} onScopeChange={changeScope} />;
  },
});

export const adminCompanyRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/entreprises/$companyId",
  component: function AdminCompanyRouteScreen() {
    const { companyId } = adminCompanyRoute.useParams();
    return <CompanyFileScreen companyId={companyId} />;
  },
});

const contactsSearch = z.object({
  onglet: z.enum(CONTACT_FILTERS).optional(),
  departement: department,
  recherche: search,
});

export const adminContactsRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/contacts",
  validateSearch: contactsSearch,
  component: function AdminContactsRouteScreen() {
    const { onglet, departement, recherche } = adminContactsRoute.useSearch();
    const navigate = adminContactsRoute.useNavigate();
    const scope = useMemo<ContactListScope>(
      () => ({ filter: onglet ?? "all", department: departement ?? null, search: recherche ?? "" }),
      [onglet, departement, recherche],
    );
    const changeScope = useCallback(
      (changes: Partial<ContactListScope>) =>
        void navigate({
          search: (previous) => ({
            ...previous,
            ...("filter" in changes
              ? { onglet: changes.filter === "all" ? undefined : changes.filter }
              : {}),
            ...("department" in changes
              ? { departement: emptyAsUndefined(changes.department) }
              : {}),
            ...("search" in changes ? { recherche: emptyAsUndefined(changes.search) } : {}),
          }),
          replace: true,
        }),
      [navigate],
    );
    return <ContactsScreen scope={scope} onScopeChange={changeScope} />;
  },
});

export const adminContactRoute = createRoute({
  getParentRoute: () => adminShellRoute,
  path: "/contacts/$contactId",
  component: function AdminContactRouteScreen() {
    const { contactId } = adminContactRoute.useParams();
    return <ContactFileScreen contactId={contactId} />;
  },
});
