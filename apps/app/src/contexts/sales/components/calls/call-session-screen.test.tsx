import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { callSeries, followUp, prospectCall, seriesCompany } from "@/test-support/call-records";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { showMobileViewport } from "@/test-support/happy-dom-window";
import { renderScreen } from "@/test-support/render-screen";
import { findBusyElement, skeletonsIn } from "@/test-support/skeletons";
import { companyFile, prospectCompany, prospectContact } from "@/test-support/sales-records";
import { dueAtOf, tomorrowOf } from "../../call-time-labels";
import { callsFr } from "../../fr-calls";
import { CallSessionScreen } from "./call-session-screen";
import type { CallSession } from "./call-session";

const text = callsFr.session;

const SERIES: CallSession = { kind: "series", department: "94", target: "never_called", size: 10 };

const FROM_TASK: CallSession = { kind: "single", companyId: "company-1", taskId: "task-9" };

const SERIES_ROUTE = "GET /api/admin/prospects/call-series";

const TRACE_ID = "7e6d5c4b-3a29-4180-9f7e-6d5c4b3a2918";

const company = (id: string, name: string, contact: string) => {
  const record = prospectCompany(id, name);
  return {
    routes: {
      [`GET /api/admin/prospects/companies/${id}`]: jsonReply(
        companyFile(record, {
          contacts: [prospectContact(`contact-${id}`, id, contact, { mobile: "06 12 00 00 01" })],
        }),
      ),
      [`GET /api/admin/prospects/companies/${id}/follow-up`]: jsonReply(followUp()),
      [`POST /api/admin/prospects/companies/${id}/calls`]: jsonReply(
        { id: `call-${id}`, taskId: null, stage: "qualified" },
        201,
      ),
      [`PATCH /api/admin/prospects/companies/${id}/qualification`]: jsonReply(null, 204),
    },
  } as const;
};

const LEFEVRE = company("company-1", "Ramonage Lefèvre", "Lefèvre");
const ROCHE = company("company-2", "Roche Fumisterie", "Roche");

const renderSeries = () => {
  const api = installFakeApi({
    [SERIES_ROUTE]: jsonReply(
      callSeries([
        seriesCompany("company-1", "Ramonage Lefèvre", {
          mainContact: { id: "contact-company-1", name: "Jean Lefèvre" },
        }),
        seriesCompany("company-2", "Roche Fumisterie", {
          mainContact: { id: "contact-company-2", name: "Jean Roche" },
        }),
      ]),
    ),
    ...LEFEVRE.routes,
    ...ROCHE.routes,
  });
  return {
    ...renderScreen(<CallSessionScreen session={SERIES} />, { path: "/admin/appels/serie" }),
    api,
  };
};

const choose = async (
  user: ReturnType<typeof renderSeries>["user"],
  group: string,
  option: string,
) => {
  const field = screen.getByRole("group", { name: group });
  await user.click(within(field).getByRole("button", { name: option }));
};

describe("CallSessionScreen", () => {
  it("asks for the series in the chosen department and target", async () => {
    const { api } = renderSeries();

    expect(await screen.findByRole("heading", { name: "Jean Lefèvre" })).toBeVisible();
    const [request] = api.requestsTo(SERIES_ROUTE);
    expect(Object.fromEntries(request?.search ?? [])).toEqual({
      target: "never_called",
      limit: "10",
      department: "94",
    });
    expect(screen.getByText(`${text.title} · ${text.position(1, 2)}`)).toBeVisible();
    expect(screen.getByRole("link", { name: text.callNumber("06 12 00 00 01") })).toHaveAttribute(
      "href",
      "tel:0612000001",
    );
    expect(screen.getByText(text.next("Jean Roche"))).toBeVisible();
  });

  it("saves the interest and the call with its callback, then moves to the next company", async () => {
    const { user, api } = renderSeries();
    await screen.findByRole("heading", { name: "Jean Lefèvre" });

    await choose(user, text.result, callsFr.outcomes.answered);
    await choose(user, callsFr.qualification.interest.label, "Tiède");
    await choose(user, text.nextAction, callsFr.nextActions.callback);
    await user.type(screen.getByRole("textbox", { name: text.notes }), "Rappeler après la tournée");
    await user.click(screen.getByRole("button", { name: text.saveAndNext }));

    expect(await screen.findByRole("heading", { name: "Jean Roche" })).toBeVisible();
    expect(
      api.requestsTo("PATCH /api/admin/prospects/companies/company-1/qualification")[0]?.body,
    ).toEqual({ interest: "warm" });
    expect(api.requestsTo("POST /api/admin/prospects/companies/company-1/calls")[0]?.body).toEqual({
      contactId: "contact-company-1",
      outcome: "answered",
      nextAction: "callback",
      schedule: { dueAt: dueAtOf(tomorrowOf(new Date()), "09:00"), notify: "minutes_15" },
      notes: "Rappeler après la tournée",
    });
    expect(screen.getByText(`${text.title} · ${text.position(2, 2)}`)).toBeVisible();
    expect(screen.getAllByText(text.tally(1, 0))[0]).toBeVisible();
    expect(await screen.findByText(text.saved)).toBeVisible();
  });

  it("uses lists on a phone and saves from the bottom button, the rest of the qualification folded", async () => {
    showMobileViewport();
    const { user, api } = renderSeries();
    await screen.findByRole("heading", { name: "Jean Lefèvre" });
    expect(screen.queryByRole("group", { name: text.result })).not.toBeInTheDocument();
    const teamSize = { name: callsFr.qualification.teamSize.label };
    expect(screen.queryByRole("combobox", teamSize)).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: text.result }));
    await user.click(await screen.findByRole("option", { name: callsFr.outcomes.answered }));
    await user.click(screen.getByRole("combobox", { name: callsFr.qualification.interest.label }));
    await user.click(await screen.findByRole("option", { name: "Froid" }));
    await user.click(screen.getByRole("combobox", { name: text.nextAction }));
    await user.click(
      await screen.findByRole("option", { name: callsFr.nextActions.not_interested }),
    );
    await user.click(screen.getByRole("button", { name: text.showQualification }));
    expect(screen.getByRole("combobox", teamSize)).toBeVisible();
    await user.click(screen.getByRole("button", { name: text.saveAndNext }));

    expect(await screen.findByRole("heading", { name: "Jean Roche" })).toBeVisible();
    expect(api.requestsTo("POST /api/admin/prospects/companies/company-1/calls")[0]?.body).toEqual({
      contactId: "contact-company-1",
      outcome: "answered",
      nextAction: "not_interested",
      schedule: null,
      notes: null,
    });
  });

  it("asks for the interest and the next action once someone answered, and sends nothing", async () => {
    const { user, api } = renderSeries();
    await screen.findByRole("heading", { name: "Jean Lefèvre" });

    await choose(user, text.result, callsFr.outcomes.answered);
    await user.click(screen.getByRole("button", { name: text.saveAndNext }));

    expect(await screen.findAllByText(text.required)).toHaveLength(2);
    expect(api.requestsTo("POST /api/admin/prospects/companies/company-1/calls")).toHaveLength(0);
  });

  it("saves a qualification answer as soon as it is chosen", async () => {
    const { user, api } = renderSeries();
    await screen.findByRole("heading", { name: "Jean Lefèvre" });
    expect(screen.getByText(callsFr.questions.interest)).toBeVisible();

    await choose(user, callsFr.qualification.teamSize.label, "2 à 3");

    await waitFor(() =>
      expect(
        api.requestsTo("PATCH /api/admin/prospects/companies/company-1/qualification")[0]?.body,
      ).toEqual({ teamSize: "two_to_three" }),
    );
    expect(screen.getByText(text.answered(1))).toBeVisible();
    expect(
      within(screen.getByRole("group", { name: callsFr.qualification.teamSize.label })).getByRole(
        "button",
        { name: "2 à 3" },
      ),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("skips a company, then sums up the series when finished", async () => {
    const { user, api } = renderSeries();
    await screen.findByRole("heading", { name: "Jean Lefèvre" });

    await user.click(screen.getByRole("button", { name: text.skip }));
    expect(await screen.findByRole("heading", { name: "Jean Roche" })).toBeVisible();
    await choose(user, text.result, callsFr.outcomes.voicemail);
    await user.click(screen.getByRole("button", { name: text.save }));

    expect(await screen.findByRole("heading", { name: text.doneTitle })).toBeVisible();
    expect(screen.getByText(`${text.doneText(1)} ${text.tally(0, 1)}.`)).toBeVisible();
    expect(screen.getByRole("link", { name: text.newSeries })).toHaveAttribute(
      "href",
      "/admin/appels",
    );
    expect(api.requestsTo("POST /api/admin/prospects/companies/company-1/calls")).toHaveLength(0);
  });

  it("closes the callback it was opened from after logging the call", async () => {
    const api = installFakeApi({
      ...LEFEVRE.routes,
      "GET /api/admin/prospects/companies/company-1/follow-up": jsonReply(
        followUp({
          calls: [prospectCall("call-0", { outcome: "voicemail", notes: "Après 16 h" })],
          lastCall: { at: "2026-10-22T08:00:00.000Z", outcome: "voicemail", by: null },
        }),
      ),
      "PATCH /api/admin/prospects/tasks/task-9": jsonReply(null, 204),
    });
    const { user } = renderScreen(<CallSessionScreen session={FROM_TASK} />, {
      path: "/admin/appels/serie",
    });

    const history = await screen.findByRole("region", { name: text.history });
    expect(history).toHaveTextContent("Après 16 h");
    await choose(user, text.result, callsFr.outcomes.no_answer);
    await user.click(screen.getByRole("button", { name: text.save }));

    expect(await screen.findByRole("heading", { name: text.doneTitle })).toBeVisible();
    expect(api.requestsTo("PATCH /api/admin/prospects/tasks/task-9")[0]?.body).toEqual({
      status: "done",
    });
  });

  it("says when no company matches the series", async () => {
    installFakeApi({ [SERIES_ROUTE]: jsonReply(callSeries([])) });

    renderScreen(<CallSessionScreen session={SERIES} />, { path: "/admin/appels/serie" });

    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
    expect(screen.getByRole("link", { name: text.emptyAction })).toHaveAttribute(
      "href",
      "/admin/appels",
    );
  });

  it("shows the desk skeleton while the series loads", async () => {
    const held = heldReply(jsonReply(callSeries([])));
    installFakeApi({ [SERIES_ROUTE]: held.reply });

    const { container } = renderScreen(<CallSessionScreen session={SERIES} />, {
      path: "/admin/appels/serie",
    });

    expect(skeletonsIn(await findBusyElement(container)).length).toBeGreaterThan(8);
    held.release();
    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
  });

  it("shows the error with its short trace id and loads the series again on retry", async () => {
    const api = installFakeApi({ [SERIES_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderScreen(<CallSessionScreen session={SERIES} />, {
      path: "/admin/appels/serie",
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    api.setRoute(SERIES_ROUTE, jsonReply(callSeries([])));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));
    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
  });
});
