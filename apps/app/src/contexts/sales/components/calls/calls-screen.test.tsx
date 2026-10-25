import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { myDay, prospectTask } from "@/test-support/call-records";
import { errorReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { prospectFilters } from "@/test-support/sales-records";
import { callsFr } from "../../fr-calls";
import { CallsScreen } from "./calls-screen";

const text = callsFr.calls;

const MY_DAY_ROUTE = "GET /api/admin/prospects/my-day";

const FILTERS_ROUTE = "GET /api/admin/prospects/filters";

const TRACE_ID = "0a9b8c7d-6e5f-4a3b-9c2d-1e0f9a8b7c6d";

const filters = prospectFilters({
  departments: [
    { code: "94", count: 120 },
    { code: "75", count: 40 },
  ],
});

const renderCalls = (dayReply = jsonReply(myDay())) => {
  const api = installFakeApi({ [MY_DAY_ROUTE]: dayReply, [FILTERS_ROUTE]: jsonReply(filters) });
  return { ...renderScreen(<CallsScreen />, { path: "/admin/appels" }), api };
};

describe("CallsScreen", () => {
  it("lists today's callbacks with who follows them and a call button", async () => {
    renderCalls(
      jsonReply(
        myDay({
          tasks: [
            prospectTask("task-1", {
              contact: { id: "contact-1", name: "Pascal Moreau" },
              owner: { id: "user-q", name: "Quentin" },
            }),
          ],
        }),
      ),
    );

    const due = await screen.findByRole("region", { name: text.dueTitle });
    const row = within(due).getByRole("listitem");
    expect(row).toHaveTextContent("Pascal Moreau");
    expect(row).toHaveTextContent("Moreau et Fils · Maisons-Alfort");
    expect(row).toHaveTextContent("Quentin");
    expect(
      within(row).getByRole("link", { name: `${callsFr.myDay.call} Pascal Moreau` }),
    ).toHaveAttribute("href", "/admin/appels/serie?entreprise=company-task-1&tache=task-1");
  });

  it("says when no callback is due and points to the series", async () => {
    renderCalls();

    const due = await screen.findByRole("region", { name: text.dueTitle });
    expect(within(due).getByText(text.dueEmpty)).toBeVisible();
    expect(within(due).getByRole("link", { name: text.volumeTitle })).toHaveAttribute(
      "href",
      "#volume",
    );
  });

  it("launches a series of the chosen size in the Val-de-Marne by default", async () => {
    const { user, router } = renderCalls();

    const volume = await screen.findByRole("region", { name: text.volumeTitle });
    await waitFor(() =>
      expect(within(volume).getByRole("combobox", { name: text.zone })).toHaveTextContent(
        "Val-de-Marne (94)",
      ),
    );
    const size = within(volume).getByRole("spinbutton", { name: text.size });
    await user.clear(size);
    await user.type(size, "8");
    await user.click(within(volume).getByRole("button", { name: text.launch(8) }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/admin/appels/serie"));
    expect(router.state.location.search).toEqual({
      nombre: 8,
      cible: "never_called",
      departement: "94",
    });
  });

  it("refuses a series outside 5 to 30 calls", async () => {
    const { user, router } = renderCalls();

    const volume = await screen.findByRole("region", { name: text.volumeTitle });
    const size = within(volume).getByRole("spinbutton", { name: text.size });
    await user.clear(size);
    await user.type(size, "40");
    await user.click(within(volume).getByRole("button", { name: text.launchInvalid }));

    expect(await within(volume).findByText(text.sizeError)).toBeVisible();
    expect(size).toHaveAttribute("aria-invalid", "true");
    expect(router.state.location.pathname).toBe("/admin/appels");
  });

  it("shows the error with its short trace id and keeps the series card usable", async () => {
    renderCalls(errorReply("internal", TRACE_ID));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    expect(screen.getByRole("region", { name: text.volumeTitle })).toBeVisible();
  });
});
