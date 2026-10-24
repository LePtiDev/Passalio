import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { busyRegions, findBusyRegion } from "@/test-support/busy-region";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeRoutes,
} from "@/test-support/fake-api";
import { withInstantRetries } from "@/test-support/instant-retries";
import { renderScreen } from "@/test-support/render-screen";
import {
  companySummary,
  contactFile,
  prospectContact,
  prospectFilters,
  prospectNoteEvent,
} from "@/test-support/sales-records";
import { salesFr } from "../../fr";
import { ContactFileScreen } from "./contact-file-screen";

const text = salesFr.file;

const FILE_ROUTE = "GET /api/admin/prospects/contacts/contact-1";
const NOTES_ROUTE = "POST /api/admin/prospects/companies/company-1/notes";

const TRACE_ID = "4c3b2a19-0f8e-47d6-a5c4-b3a291807f6e";

const DUPONT_FILE = contactFile(
  prospectContact("contact-1", "company-1", "Dupont", { email: "jean@ramonage.test" }),
  companySummary("company-1", "Ramonage Créteil"),
);

const renderFile = (routes: FakeRoutes) => {
  const api = installFakeApi({
    "GET /api/admin/prospects/filters": jsonReply(prospectFilters()),
    ...routes,
  });
  return {
    ...renderScreen(withInstantRetries(<ContactFileScreen contactId="contact-1" />), {
      path: "/admin/contacts/contact-1",
    }),
    api,
  };
};

describe("ContactFileScreen", () => {
  it("shows a skeleton of the file while it loads", async () => {
    const reply = heldReply(jsonReply(DUPONT_FILE));
    renderFile({ [FILE_ROUTE]: reply.reply });

    expect(await findBusyRegion()).toBeInTheDocument();

    reply.release();

    expect(await screen.findAllByRole("heading", { name: "Jean Dupont" })).not.toHaveLength(0);
    expect(busyRegions()).toHaveLength(0);
  });

  it("says the contact no longer exists and links back to the contacts", async () => {
    renderFile({ [FILE_ROUTE]: errorReply("contact_not_found", TRACE_ID, 404) });

    expect(await screen.findByText(text.notFoundTitle)).toBeVisible();
    expect(screen.getByRole("link", { name: text.backToList })).toHaveAttribute(
      "href",
      "/admin/contacts",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the error with the short trace id and loads the contact again on retry", async () => {
    const { user, api } = renderFile({ [FILE_ROUTE]: errorReply("internal", TRACE_ID) });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(FILE_ROUTE, jsonReply(DUPONT_FILE));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findAllByRole("heading", { name: "Jean Dupont" })).not.toHaveLength(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the contact with its company, a call link and the notes about them", async () => {
    renderFile({
      [FILE_ROUTE]: jsonReply({
        ...DUPONT_FILE,
        events: [prospectNoteEvent("event-1", "Préfère être appelé le matin.")],
      }),
    });

    expect(await screen.findAllByRole("heading", { name: "Jean Dupont" })).not.toHaveLength(0);
    expect(
      screen
        .getAllByRole("link", { name: /Ramonage Créteil/ })
        .map((link) => link.getAttribute("href")),
    ).toContain("/admin/entreprises/company-1");
    expect(screen.getAllByRole("link", { name: text.call })[0]).toHaveAttribute(
      "href",
      "tel:0612345678",
    );
    expect(screen.getAllByText("jean@ramonage.test").length).toBeGreaterThan(0);
    expect(screen.getByText("Préfère être appelé le matin.")).toBeVisible();
  });

  it("adds a note about the contact to the company history", async () => {
    const { user, api } = renderFile({
      [FILE_ROUTE]: jsonReply(DUPONT_FILE),
      [NOTES_ROUTE]: jsonReply({ id: "note-1" }, 201),
    });

    expect(await screen.findByText(salesFr.history.empty)).toBeVisible();
    const field = screen.getByRole("textbox", { name: salesFr.history.noteLabel });
    await user.type(field, "Rappeler jeudi");
    await user.click(screen.getByRole("button", { name: salesFr.history.add }));

    expect(await screen.findByText(salesFr.history.noteAdded)).toBeVisible();
    expect(api.requestsTo(NOTES_ROUTE)[0]?.body).toEqual({
      body: "Rappeler jeudi",
      contactId: "contact-1",
    });
  });
});
