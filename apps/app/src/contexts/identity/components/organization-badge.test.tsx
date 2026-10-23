import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { heldReply, installFakeApi } from "@/test-support/fake-api";
import {
  ORGANIZATION_ROUTE,
  organizationReply,
  signedInRoutes,
} from "@/test-support/identity-replies";
import { renderScreen } from "@/test-support/render-screen";
import { busyElementIn, findBusyElement, skeletonsIn } from "@/test-support/skeletons";
import { identityFr } from "../fr";
import { OrganizationBadge } from "./organization-badge";

describe("OrganizationBadge", () => {
  it("shows a skeleton of the logo and name until the company is loaded", async () => {
    const organization = heldReply(organizationReply({ name: "Ramonage Dupont" }));
    installFakeApi({ ...signedInRoutes("owner"), [ORGANIZATION_ROUTE]: organization.reply });

    const { container } = renderScreen(<OrganizationBadge />);

    const skeleton = await findBusyElement(container);
    expect(skeletonsIn(skeleton)).toHaveLength(3);
    expect(screen.queryByText("Ramonage Dupont")).not.toBeInTheDocument();

    organization.release();

    expect(await screen.findByText("Ramonage Dupont")).toBeVisible();
    expect(screen.getByText(identityFr.organizationBadge.freeTrial)).toBeVisible();
    expect(busyElementIn(container)).toBeNull();
  });
});
