import { screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it } from "vitest";
import { fr } from "@/fr";
import {
  errorReply,
  heldReply,
  installFakeApi,
  jsonReply,
  type FakeRoutes,
} from "@/test-support/fake-api";
import { withInstantRetries } from "@/test-support/instant-retries";
import { renderScreen } from "@/test-support/render-screen";
import { companyFile, prospectCompany, prospectFilters } from "@/test-support/sales-records";
import { salesFr } from "../../fr";
import { CompanyFileScreen } from "./company-file-screen";

const text = salesFr.file;

const FILE_ROUTE = "GET /api/admin/prospects/companies/company-9";
const NOTES_ROUTE = "POST /api/admin/prospects/companies/company-9/notes";
const STAGE_ROUTE = "POST /api/admin/prospects/companies/company-9/stage";

const TRACE_ID = "c9d8e7f6-a5b4-4c3d-9e2f-1a0b9c8d7e6f";

const VITRY = prospectCompany("company-9", "Ramonage Vitry");

const renderFile = (routes: FakeRoutes) => {
  const api = installFakeApi({
    "GET /api/admin/prospects/filters": jsonReply(prospectFilters()),
    ...routes,
  });
  return {
    ...renderScreen(withInstantRetries(<CompanyFileScreen companyId="company-9" />), {
      path: "/admin/entreprises/company-9",
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

const openStageMenu = async (user: ReturnType<typeof renderFile>["user"]) => {
  const [stageButton] = await screen.findAllByRole("button", { name: text.stageLabel });
  if (stageButton === undefined) {
    throw new Error("the stage button is missing");
  }
  await user.click(stageButton);
  return screen.findByRole("menu");
};

describe("CompanyFileScreen feedback", () => {
  afterEach(() => {
    toast.dismiss();
  });

  it("ignores a note made only of spaces and sends the next real note", async () => {
    const { user, api } = renderFile({
      [FILE_ROUTE]: jsonReply(companyFile(VITRY)),
      [NOTES_ROUTE]: jsonReply({ id: "note-9" }, 201),
    });

    const field = await screen.findByRole("textbox", { name: salesFr.history.noteLabel });
    await user.type(field, "   ");
    const add = within(noteFormOf(field)).getByRole("button", { name: salesFr.history.add });
    await user.click(add);
    await user.clear(field);
    await user.type(field, "Rappeler lundi");
    await user.click(add);

    expect(await screen.findByText(salesFr.history.noteAdded)).toBeVisible();
    expect(api.requestsTo(NOTES_ROUTE).map(({ body }) => body)).toEqual([
      { body: "Rappeler lundi", contactId: null },
    ]);
  });

  it("disables the add button while the note is being saved", async () => {
    const note = heldReply(jsonReply({ id: "note-9" }, 201));
    const { user } = renderFile({
      [FILE_ROUTE]: jsonReply(companyFile(VITRY)),
      [NOTES_ROUTE]: note.reply,
    });

    const field = await screen.findByRole("textbox", { name: salesFr.history.noteLabel });
    await user.type(field, "Devis envoyé");
    const add = within(noteFormOf(field)).getByRole("button", { name: salesFr.history.add });
    await user.click(add);

    await waitFor(() => expect(add).toBeDisabled());
    note.release();

    expect(await screen.findByText(salesFr.history.noteAdded)).toBeVisible();
    await waitFor(() => expect(add).toBeEnabled());
  });

  it("checks the current stage in the menu and sends only a different stage", async () => {
    const { user, api } = renderFile({
      [FILE_ROUTE]: jsonReply(companyFile(VITRY)),
      [STAGE_ROUTE]: jsonReply(null, 204),
    });

    const menu = await openStageMenu(user);
    const current = within(menu).getByRole("menuitemradio", { name: salesFr.stages.to_qualify });
    expect(current).toHaveAttribute("aria-checked", "true");
    expect(
      within(menu).getByRole("menuitemradio", { name: salesFr.stages.interested }),
    ).toHaveAttribute("aria-checked", "false");
    await user.click(current);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

    const reopened = await openStageMenu(user);
    await user.click(
      within(reopened).getByRole("menuitemradio", { name: salesFr.stages.interested }),
    );

    expect(
      await screen.findByText(salesFr.stageReached("Ramonage Vitry", "interested")),
    ).toBeVisible();
    expect(api.requestsTo(STAGE_ROUTE).map(({ body }) => body)).toEqual([{ stage: "interested" }]);
  });

  it("shows a toast with the short trace id when the stage cannot be changed", async () => {
    const { user } = renderFile({
      [FILE_ROUTE]: jsonReply(companyFile(VITRY)),
      [STAGE_ROUTE]: errorReply("internal", TRACE_ID),
    });

    const menu = await openStageMenu(user);
    await user.click(within(menu).getByRole("menuitemradio", { name: salesFr.stages.interested }));

    expect(await screen.findByText(fr.errors.messages.internal)).toBeVisible();
    expect(screen.getByText(fr.errors.code(TRACE_ID.slice(0, 8)))).toBeVisible();
    expect(screen.queryByText(salesFr.stageReached("Ramonage Vitry", "interested"))).toBeNull();
  });

  it("offers no call link when neither the company nor a contact has a phone", async () => {
    renderFile({
      [FILE_ROUTE]: jsonReply(
        companyFile(prospectCompany("company-9", "Ramonage Vitry", { phone: null })),
      ),
    });

    expect(await screen.findByText(text.contactsEmpty)).toBeVisible();
    expect(screen.queryByRole("link", { name: text.call })).toBeNull();
    const calls = screen.getAllByText(text.call);
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.closest("[aria-disabled='true']")).not.toBeNull();
    }
  });
});
