import type { OrganizationRole } from "@passalio/shared";
import type { TradeId } from "@passalio/trades";
import { jsonReply, type FakeReply } from "./fake-api";

export const ACTOR_ROUTE = "GET /api/me";

export const ORGANIZATION_ROUTE = "GET /api/organization";

export const actorReply = (
  role: OrganizationRole,
  organizationId: string,
  isImpersonating = false,
): FakeReply => jsonReply({ actor: { userId: "user-1", organizationId, role, isImpersonating } });

export const organizationReply = (organizationId: string, trades: readonly TradeId[]): FakeReply =>
  jsonReply({
    organization: {
      id: organizationId,
      name: "Ramonage Martin",
      siret: null,
      address: null,
      phone: null,
      teamSize: null,
      trades,
      brandColor: "#0E7C5A",
      documentNumberPrefix: "RM",
      nextDocumentNumber: 1,
      hasLogo: false,
      isOnboardingCompleted: true,
    },
  });
