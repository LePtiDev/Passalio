import { screen, waitFor, within } from "@testing-library/react";
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
  companyFile,
  prospectCompany,
  prospectContact,
  prospectFilters,
  prospectNoteEvent,
} from "@/test-support/sales-records";
import { salesFr } from "../../fr";
import { CompanyFileScreen } from "./company-file-screen";

const text = salesFr.file;

const FILE_ROUTE = "GET /api/admin/prospects/companies/company-1";
const NOTES_ROUTE = "POST /api/admin/prospects/companies/company-1/notes";
const STAGE_ROUTE = "POST /api/admin/prospects/companies/company-1/stage";

const TRACE_ID = "3a2b1c0d-9e8f-4a7b-8c6d-5e4f3a2b1c0d";

const CRETEIL = prospectCompany("company-1", "Ramonage Créteil");

const renderFile = (routes: FakeRoutes) => {
  const api = installFakeApi({
    "GET /api/admin/prospects/filters": jsonReply(prospectFilters()),
    ...routes,
  });
  return {
    ...renderScreen(withInstantRetries(<CompanyFileScreen companyId="company-1" />), {
      path: "/admin/entreprises/company-1",
    }),
    api,
  };
};

const noteFormOf = (field: HTMLElement) => {
  const form = field.closest("form");
  if (form === null) {
    throw new Error("the note field is not in a form");
  }
  return form;
};

describe("CompanyFileScreen", () => {
  it("shows a skeleton of the file while it loads", async () => {
    const reply = heldReply(jsonReply(companyFile(CRETEIL)));
    renderFile({ [FILE_ROUTE]: reply.reply });

    expect(await findBusyRegion()).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Ramonage Créteil" })).toBeNull();

    reply.release();

    expect(await screen.findAllByRole("heading", { name: "Ramonage Créteil" })).not.toHaveLength(0);
    expect(busyRegions()).toHaveLength(0);
  });

  it("says the file no longer exists and links back to the companies", async () => {
    renderFile({ [FILE_ROUTE]: errorReply("company_not_found", TRACE_ID, 404) });

    expect(await screen.findByText(text.notFoundTitle)).toBeVisible();
    expect(screen.getByText(text.notFoundText)).toBeVisible();
    expect(screen.getByRole("link", { name: text.backToList })).toHaveAttribute(
      "href",
      "/admin/entreprises",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the error with the short trace id and loads the file again on retry", async () => {
    const { user, api } = renderFile({ [FILE_ROUTE]: errorReply("internal", TRACE_ID) });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.messages.internal);
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(alert).not.toHaveTextContent(TRACE_ID);

    api.setRoute(FILE_ROUTE, jsonReply(companyFile(CRETEIL)));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));

    expect(await screen.findAllByRole("heading", { name: "Ramonage Créteil" })).not.toHaveLength(0);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the company with its contacts, its history and a call link", async () => {
    renderFile({
      [FILE_ROUTE]: jsonReply(
        companyFile(CRETEIL, {
          contacts: [prospectContact("contact-1", "company-1", "Dupont")],
          events: [
            prospectNoteEvent("event-1", "Rappeler après les vacances.", {
              contact: { id: "contact-1", name: "Jean Dupont" },
            }),
          ],
        }),
      ),
    });

    expect(await screen.findAllByRole("heading", { name: "Ramonage Créteil" })).not.toHaveLength(0);
    const [contactLink] = screen.getAllByRole("link", {
      name: salesFr.contacts.open("Jean Dupont"),
    });
    expect(contactLink).toHaveAttribute("href", "/admin/contacts/contact-1");
    expect(screen.getByText("Rappeler après les vacances.")).toBeVisible();
    expect(screen.getByText(/à propos de Jean Dupont/)).toBeVisible();
    expect(screen.getAllByRole("link", { name: text.call })[0]).toHaveAttribute(
      "href",
      "tel:0145678910",
    );
    expect(screen.queryByText(salesFr.history.empty)).toBeNull();
  });

  it("offers to add a contact and a note when the company has neither", async () => {
    const { user } = renderFile({ [FILE_ROUTE]: jsonReply(companyFile(CRETEIL)) });

    expect(await screen.findByText(text.contactsEmpty)).toBeVisible();
    expect(screen.getByText(salesFr.history.empty)).toBeVisible();
    expect(screen.getByRole("textbox", { name: salesFr.history.noteLabel })).toBeVisible();

    await user.click(screen.getByRole("button", { name: text.addContact }));

    expect(
      await screen.findByRole("dialog", { name: salesFr.contactForm.createTitle }),
    ).toBeVisible();
  });

  it("adds a note, confirms with a toast and empties the field", async () => {
    const { user, api } = renderFile({
      [FILE_ROUTE]: jsonReply(companyFile(CRETEIL)),
      [NOTES_ROUTE]: jsonReply({ id: "note-1" }, 201),
    });

    const field = await screen.findByRole("textbox", { name: salesFr.history.noteLabel });
    await user.type(field, "Intéressé par la démo");
    await user.click(within(noteFormOf(field)).getByRole("button", { name: salesFr.history.add }));

    expect(await screen.findByText(salesFr.history.noteAdded)).toBeVisible();
    expect(api.requestsTo(NOTES_ROUTE)[0]?.body).toEqual({
      body: "Intéressé par la démo",
      contactId: null,
    });
    await waitFor(() => expect(field).toHaveValue(""));
  });

  it("shows a toast with the short trace id when the note cannot be added", async () => {
    const { user } = renderFile({
      [FILE_ROUTE]: jsonReply(companyFile(CRETEIL)),
      [NOTES_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const field = await screen.findByRole("textbox", { name: salesFr.history.noteLabel });
    await user.type(field, "Note perdue");
    await user.click(within(noteFormOf(field)).getByRole("button", { name: salesFr.history.add }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(field).toHaveValue("Note perdue");
  });

  it("changes the stage from the stage menu and confirms with a toast", async () => {
    const { user, api } = renderFile({
      [FILE_ROUTE]: jsonReply(companyFile(CRETEIL)),
      [STAGE_ROUTE]: jsonReply(null, 204),
    });

    const [stageButton] = await screen.findAllByRole("button", { name: text.stageLabel });
    if (stageButton === undefined) {
      throw new Error("the stage button is missing");
    }
    await user.click(stageButton);
    await user.click(await screen.findByRole("menuitemradio", { name: salesFr.stages.interested }));

    expect(
      await screen.findByText(salesFr.stageReached("Ramonage Créteil", "interested")),
    ).toBeVisible();
    expect(api.requestsTo(STAGE_ROUTE)[0]?.body).toEqual({ stage: "interested" });
  });
});
