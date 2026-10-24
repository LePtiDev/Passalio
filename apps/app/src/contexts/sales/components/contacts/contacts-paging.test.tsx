import { screen, waitFor, within } from "@testing-library/react";
import { useCallback, useState } from "react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import {
  installFakeApi,
  jsonReply,
  type FakeRequest,
  type FakeRoutes,
} from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { contactSummary, contactsPage, prospectFilters } from "@/test-support/sales-records";
import { salesFr } from "../../fr";
import type { ContactListScope } from "../../sales-api";
import { ContactsScreen } from "./contacts-screen";

const text = salesFr.contacts;

const CONTACTS_ROUTE = "GET /api/admin/prospects/contacts";

const ContactsHarness = ({ initialScope }: { readonly initialScope: ContactListScope }) => {
  const [scope, setScope] = useState<ContactListScope>(initialScope);
  const change = useCallback(
    (changes: Partial<ContactListScope>) => setScope((previous) => ({ ...previous, ...changes })),
    [],
  );
  return <ContactsScreen scope={scope} onScopeChange={change} />;
};

const renderContacts = (
  routes: FakeRoutes,
  initialScope: ContactListScope = { filter: "all", department: null, search: "" },
) => {
  const api = installFakeApi({
    "GET /api/admin/prospects/filters": jsonReply(prospectFilters()),
    ...routes,
  });
  return {
    ...renderScreen(<ContactsHarness initialScope={initialScope} />, { path: "/admin/contacts" }),
    api,
  };
};

const contactTab = (name: string) => {
  const [desktopTabs] = screen.getAllByRole("tablist", { name: text.title });
  if (desktopTabs === undefined) {
    throw new Error("the contact tabs are missing");
  }
  return within(desktopTabs).getByRole("tab", { name: new RegExp(`^${name}`) });
};

const limitOf = (request: FakeRequest) => Number(request.search.get("limit"));

describe("ContactsScreen tabs and pagination", () => {
  it("asks the server for the leaders when the leaders tab is chosen", async () => {
    const { user, api } = renderContacts({
      [CONTACTS_ROUTE]: (request) =>
        jsonReply(
          contactsPage({
            contacts: [
              request.search.get("filter") === "leaders"
                ? contactSummary("contact-leader", "Paul Gérant")
                : contactSummary("contact-staff", "Luc Employé", { isLeader: false }),
            ],
            counts: { all: 2, leaders: 1, no_phone: 0 },
          }),
        ),
    });

    expect(await screen.findByRole("link", { name: text.open("Luc Employé") })).toBeVisible();
    await user.click(contactTab(text.tabs.leaders));

    expect(await screen.findByRole("link", { name: text.open("Paul Gérant") })).toBeVisible();
    expect(screen.queryByRole("link", { name: text.open("Luc Employé") })).toBeNull();
    expect(api.requestsTo(CONTACTS_ROUTE).at(-1)?.search.get("filter")).toBe("leaders");
    expect(contactTab(text.tabs.leaders)).toHaveAttribute("aria-selected", "true");
  });

  it("disables the previous page on the first page and the next page on the last one", async () => {
    const { user } = renderContacts({
      [CONTACTS_ROUTE]: (request) => {
        const limit = limitOf(request);
        const counts = { all: limit + 1, leaders: limit + 1, no_phone: 0 };
        return request.search.get("cursor") === "cursor-end"
          ? jsonReply(
              contactsPage({ contacts: [contactSummary("contact-end", "Yves Final")], counts }),
            )
          : jsonReply(
              contactsPage({
                contacts: Array.from({ length: limit }, (_, index) =>
                  contactSummary(`contact-page-${index}`, `Personne ${index}`),
                ),
                counts,
                nextCursor: "cursor-end",
              }),
            );
      },
    });

    expect(await screen.findByRole("link", { name: text.open("Personne 0") })).toBeVisible();
    const pagination = screen.getByRole("navigation", { name: fr.pagination.label });
    const previous = within(pagination).getByRole("button", { name: fr.pagination.previous });
    const next = within(pagination).getByRole("button", { name: fr.pagination.next });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);

    expect(await screen.findByRole("link", { name: text.open("Yves Final") })).toBeVisible();
    await waitFor(() => expect(next).toBeDisabled());

    await user.click(previous);

    expect(await screen.findByRole("link", { name: text.open("Personne 0") })).toBeVisible();
    expect(screen.queryByRole("link", { name: text.open("Yves Final") })).toBeNull();
    expect(previous).toBeDisabled();
  });
});
