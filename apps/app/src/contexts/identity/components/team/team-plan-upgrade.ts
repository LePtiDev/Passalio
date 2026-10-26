import type { ComponentType } from "react";
import type { InvitationRequest } from "../../hooks/use-team";

export const TEAM_PLAN_REQUIRED = "team_plan_required";

export type TeamPlanUpgradeProps = {
  readonly invitee: InvitationRequest;
  readonly onCancel: () => void;
  readonly onUpgraded: () => Promise<void>;
};

export type TeamPlanUpgrade = ComponentType<TeamPlanUpgradeProps>;
