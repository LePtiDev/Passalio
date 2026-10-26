import type { ReactNode } from "react";
import { useOrganization } from "@/contexts/identity";
import { useSubscription } from "../hooks/use-subscription";
import { isWorkspaceBlocked } from "../subscription-view";
import { BlockedWorkspaceScreen } from "./blocked-workspace-screen";

type WorkspaceGateProps = {
  readonly email: string;
  readonly children: ReactNode;
};

export const WorkspaceGate = ({ email, children }: WorkspaceGateProps) => {
  const { data } = useSubscription();
  const organization = useOrganization();
  return data !== undefined && isWorkspaceBlocked(data) ? (
    <BlockedWorkspaceScreen
      subscription={data}
      email={email}
      organizationName={organization.data?.name ?? null}
    />
  ) : (
    children
  );
};
