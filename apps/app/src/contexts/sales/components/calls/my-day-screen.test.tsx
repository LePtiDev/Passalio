import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fr } from "@/fr";
import { myDay, prospectTask } from "@/test-support/call-records";
import { errorReply, heldReply, installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { findBusyElement, skeletonsIn } from "@/test-support/skeletons";
import { callsFr } from "../../fr-calls";
import { MyDayScreen } from "./my-day-screen";

const text = callsFr.myDay;

const MY_DAY_ROUTE = "GET /api/admin/prospects/my-day";

const TRACE_ID = "4f1e2d3c-b4a5-4c6d-8e7f-0a1b2c3d4e5f";

const LATER = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

const EARLIER = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const tile = (label: string) => screen.getByText(label).closest("li");

const todoList = () => screen.getByRole("region", { name: text.todo });

describe("MyDayScreen", () => {
  it("shows the counts and lists what to do, each line opening the call", async () => {
    installFakeApi({
      [MY_DAY_ROUTE]: jsonReply(
        myDay({
          tasks: [
            prospectTask("late", { dueAt: EARLIER }),
            prospectTask("next", {
              dueAt: LATER,
              owner: null,
              contact: { id: "contact-k", name: "Karim Haddad" },
              company: { id: "company-k", name: "KH Ramonage", city: "Ivry", phone: null },
            }),
            prospectTask("demo", { kind: "demo", dueAt: LATER }),
          ],
          counts: { overdue: 1, today: 2, callsToday: 9 },
        }),
      ),
    });

    renderScreen(<MyDayScreen />, { path: "/admin/journee" });

    const karim = await screen.findByRole("link", { name: /Karim Haddad · KH Ramonage, Ivry/ });
    expect(karim).toHaveAttribute("href", "/admin/appels/serie?entreprise=company-k&tache=next");
    expect(within(karim).getByText(text.unassigned)).toBeVisible();
    expect(within(todoList()).getAllByRole("listitem")).toHaveLength(3);
    expect(within(todoList()).getAllByRole("link", { name: /\(En retard\)/ })).toHaveLength(1);
    expect(tile(text.callsToday)).toHaveTextContent("9");
    expect(tile(text.callbacks)).toHaveTextContent("2");
    expect(tile(text.overdue)).toHaveTextContent(text.overdueHint(1));
    expect(tile(text.demos)).toHaveTextContent(text.demosHint(1));
    for (const start of screen.getAllByRole("link", { name: text.start })) {
      expect(start).toHaveAttribute("href", "/admin/appels/serie?depuis=journee");
    }
    expect(screen.getByRole("link", { name: new RegExp(text.volumeLead) })).toHaveAttribute(
      "href",
      "/admin/appels",
    );
  });

  it("proposes a series of calls when nothing is planned", async () => {
    installFakeApi({ [MY_DAY_ROUTE]: jsonReply(myDay()) });

    renderScreen(<MyDayScreen />, { path: "/admin/journee" });

    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
    expect(screen.getByRole("link", { name: text.emptyAction })).toHaveAttribute(
      "href",
      "/admin/appels",
    );
    for (const start of screen.getAllByRole("link", { name: text.start })) {
      expect(start).toHaveAttribute("href", "/admin/appels");
    }
  });

  it("shows tile and row skeletons while the day loads", async () => {
    const held = heldReply(jsonReply(myDay()));
    installFakeApi({ [MY_DAY_ROUTE]: held.reply });

    const { container } = renderScreen(<MyDayScreen />, { path: "/admin/journee" });

    const busy = await findBusyElement(container);
    expect(skeletonsIn(busy).length).toBeGreaterThan(12);
    held.release();
    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
  });

  it("shows the error with its short trace id and loads the day again on retry", async () => {
    const api = installFakeApi({ [MY_DAY_ROUTE]: errorReply("internal", TRACE_ID) });

    const { user } = renderScreen(<MyDayScreen />, { path: "/admin/journee" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(fr.errors.code(TRACE_ID.slice(0, 8)));
    api.setRoute(MY_DAY_ROUTE, jsonReply(myDay()));
    await user.click(within(alert).getByRole("button", { name: fr.errors.retry }));
    expect(await screen.findByText(text.emptyTitle)).toBeVisible();
  });

  it("opens the configuration from the mobile header", async () => {
    installFakeApi({ [MY_DAY_ROUTE]: jsonReply(myDay()) });

    renderScreen(<MyDayScreen />, { path: "/admin/journee" });

    expect(await screen.findByRole("link", { name: text.configuration })).toHaveAttribute(
      "href",
      "/admin/configuration",
    );
  });
});
