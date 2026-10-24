import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { installFakeApi, jsonReply } from "@/test-support/fake-api";
import { renderScreen } from "@/test-support/render-screen";
import { companyFile, prospectCompany, prospectFilters } from "@/test-support/sales-records";
import { salesFr } from "../../fr";
import { CompanyFileScreen } from "./company-file-screen";

const renderFile = () => {
  installFakeApi({
    "GET /api/admin/prospects/filters": jsonReply(prospectFilters()),
    "GET /api/admin/prospects/companies/company-9": jsonReply(
      companyFile(prospectCompany("company-9", "Ramonage Vitry")),
    ),
  });
  renderScreen(<CompanyFileScreen companyId="company-9" />, {
    path: "/admin/entreprises/company-9",
  });
};

describe("CompanyFileScreen call note", () => {
  it("opens the call screen for this company, on a computer and on a phone", async () => {
    renderFile();
    const links = await screen.findAllByRole("link", { name: salesFr.file.noteCall });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin/appels/serie?entreprise=company-9",
      "/admin/appels/serie?entreprise=company-9",
    ]);
  });
});
