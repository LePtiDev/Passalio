import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unwrap } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { identityFr } from "../fr";
import { identityApi } from "../identity-api";

type AcceptInvitationCardProps = {
  readonly organizationId: string;
  readonly invitationId: string;
};

export const AcceptInvitationCard = ({
  organizationId,
  invitationId,
}: AcceptInvitationCardProps) => {
  const navigate = useNavigate();
  const accept = useMutation({
    mutationFn: async () =>
      unwrap(await identityApi.acceptInvitation(organizationId, invitationId)),
    onSuccess: async () => {
      await authClient.organization.setActive({ organizationId });
      toast.success(identityFr.invitation.accepted);
      await navigate({ to: "/equipe" });
    },
  });

  const { mutate } = accept;
  const acceptNow = useCallback(() => mutate(), [mutate]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{identityFr.invitation.title}</h1>
      <p>{identityFr.invitation.text}</p>
      <Button className="h-12 text-base" disabled={accept.isPending} onClick={acceptNow}>
        {accept.isPending ? identityFr.invitation.accepting : identityFr.invitation.accept}
      </Button>
    </section>
  );
};
