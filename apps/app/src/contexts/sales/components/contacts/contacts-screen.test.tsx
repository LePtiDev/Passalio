import { screen, within } from "@testing-library/react";
import { useCallback, useState } from "react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import {
  errorReply,
  heldReply,
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
const FILTERS_ROUTE = "GET /api/admin/prospects/filters";

const TRACE_ID = "8b7a6958-4736-4251-9e0d-fc1b2a394857";

const EVERYONE: ContactListScope = { filter: "all", department: null, search: "" };

const ContactsHarness = () => {
  const [scope, setScope] = useState<ContactListScope>(EVERYONE);
  const change = useCallback(
    (changes: Partial<ContactListScope>) => setScope((previous) => ({ ...previous, ...changes })),
    [],
  );
  return <ContactsScreen scope={scope} onScopeChange={change} />;
};

const renderContacts = (routes: FakeRoutes) => {
  const api = installFakeApi({ [FILTERS_ROUTE]: jsonReply(prospectFilters()), ...routes });
  return { ...renderScreen(<ContactsHarness />, { path: "/admin/contacts" }), api };
};

const lastContactsRequest = (api: ReturnType<typeof renderContacts>["api"]) =>
  api.requestsTo(CONTACTS_ROUTE).at(-1);

const contactTab = (name: string) => {
  const [desktopTabs] = screen.getAllByRole("tablist", { name: text.title });
  if (desktopTabs === undefined) {
    throw new Error("the contact tabs are missing");
  }
  return within(desktopTabs).getByRole("tab", { name: new RegExp(`^${name}`) });
};

const ONE_CONTACT = contactsPage({
  contacts: [contactSummary("contact-1", "Jean Dupont")],
  counts: { all: 1, leaders: 1, no_phone: 0 },
});

const limitOf = (request: FakeRequest) => Number(request.search.get("limit"));

describe("ContactsScreen", () => {
  it("shows a skeleton of the list while the contacts load", async () => {
    const reply = heldReply(jsonReply(contactsPage()));
    renderContacts({ [CONTACTS_ROUTE]: reply.reply });

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByText(text.emptyTitle)).not.toBeInTheDocument();

    reply.release();

    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
    expect(busyRegions()).toHaveLength(0);
  });

  it("sends to the companies to add the first contact when there is none", async () => {
    renderContacts({ [CONTACTS_ROUTE]: jsonReply(contactsPage()) });

    const title = await screen.findByText(text.emptyTitle);
    expect(screen.getByText(text.emptyText)).toBeVisible();
    const frame = title.closest("div");
    if (frame === null) {
      throw new Error("the empty state has no frame");
    }
    expect(within(frame).getByRole("link", { name: salesFr.companies.title })).toHaveAttribute(
      "href",
      "/admin/entreprises",
    );
  });

  it("shows the contacts of the chosen tab and offers to show all when there is none", async () => {
    const { user, api } = renderContacts({
      [CONTACTS_ROUTE]: (request) =>
        request.search.get("filter") === "no_phone"
          ? jsonReply(contactsPage({ counts: { all: 1, leaders: 1, no_phone: 0 } }))
          : jsonReply(ONE_CONTACT),
    });

    expect(await screen.findByRole("link", { name: text.open("Jean Dupont") })).toBeVisible();
    await user.click(contactTab(text.tabs.no_phone));

    expect(await screen.findByText(text.filterEmpty)).toBeVisible();
    expect(lastContactsRequest(api)?.search.get("filter")).toBe("no_phone");
    expect(contactTab(text.tabs.no_phone)).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: salesFr.list.showAll }));

    expect(await screen.findByRole("link", { name: text.open("Jean Dupont") })).toBeVisible();
    expect(lastContactsRequest(api)?.search.get("filter")).toBe("all");
  });

  it("searches the contacts and offers to clear a search without result", async () => {
    const { user, api } = renderContacts({
      [CONTACTS_ROUTE]: (request) =>
        request.search.get("q") === "Personne"
          ? jsonReply(contactsPage({ counts: { all: 1, leaders: 1, no_phone: 0 } }))
          : jsonReply(ONE_CONTACT),
    });

    expect(await screen.findByRole("link", { name: text.open("Jean Dupont") })).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: text.searchLabel }), "Personne");

    expect(await screen.findByText(text.searchEmptyTitle("Personne"))).toBeVisible();
    expect(lastContactsRequest(api)?.search.get("q")).toBe("Personne");

    await user.click(screen.getByRole("button", { name: salesFr.list.clearSearch }));

    expect(await screen.findByRole("link", { name: text.open("Jean Dupont") })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: text.searchLabel })).toHaveValue("");
  });

  it("shows the error with the short trace id and loads the contacts again on retry", async () => {
    const { user, api } = renderContacts({ [CONTACTS_ROUTE]: errorReply("internal", TRACE_ID) });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(CONTACTS_ROUTE, jsonReply(ONE_CONTACT));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findByRole("link", { name: text.open("Jean Dupont") })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lists the contacts with their company and phone and the tab counts", async () => {
    renderContacts({
      [CONTACTS_ROUTE]: jsonReply(
        contactsPage({
          contacts: [
            contactSummary("contact-1", "Jean Dupont", { email: "jean@ramonage.test" }),
            contactSummary("contact-2", "Marie Durand", {
              phone: null,
              isLeader: false,
              jobTitle: null,
            }),
          ],
          counts: { all: 2, leaders: 1, no_phone: 1 },
        }),
      ),
    });

    const jean = await screen.findByRole("link", { name: text.open("Jean Dupont") });
    expect(jean).toHaveAttribute("href", "/admin/contacts/contact-1");
    expect(jean).toHaveTextContent("Ramonage Créteil");
    expect(jean).toHaveTextContent("06 12 34 56 78");
    expect(jean).toHaveTextContent("jean@ramonage.test");
    const marie = screen.getByRole("link", { name: text.open("Marie Durand") });
    expect(marie).toHaveTextContent(salesFr.list.noPhone);
    expect(marie).toHaveTextContent(salesFr.list.noEmail);
    expect(contactTab(text.tabs.all)).toHaveTextContent("2");
    expect(contactTab(text.tabs.no_phone)).toHaveTextContent("1");
    expect(await screen.findByText(text.subtitle(9, 16))).toBeInTheDocument();
  });

  it("moves to the next page with the server cursor", async () => {
    const { user, api } = renderContacts({
      [CONTACTS_ROUTE]: (request) => {
        const limit = limitOf(request);
        const counts = { all: limit + 1, leaders: limit + 1, no_phone: 0 };
        return request.search.get("cursor") === "cursor-2"
          ? jsonReply(
              contactsPage({ contacts: [contactSummary("contact-last", "Zoé Dernière")], counts }),
            )
          : jsonReply(
              contactsPage({
                contacts: Array.from({ length: limit }, (_, index) =>
                  contactSummary(`contact-${index}`, `Contact ${index}`),
                ),
                counts,
                nextCursor: "cursor-2",
              }),
            );
      },
    });

    expect(await screen.findByRole("link", { name: text.open("Contact 0") })).toBeVisible();
    const pagination = screen.getByRole("navigation", { name: fr.pagination.label });
    await user.click(within(pagination).getByRole("button", { name: fr.pagination.next }));

    expect(await screen.findByRole("link", { name: text.open("Zoé Dernière") })).toBeVisible();
    expect(lastContactsRequest(api)?.search.get("cursor")).toBe("cursor-2");
    expect(within(pagination).getByRole("button", { name: fr.pagination.previous })).toBeEnabled();
  });
});
