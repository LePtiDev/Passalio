import { zodResolver } from "@hookform/resolvers/zod";
import { ORGANIZATION_ROLES } from "@passalio/shared";
import { useController, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { identityFr } from "../fr";
import { useInviteMember } from "../hooks/use-team";
import { RoleSelect } from "./role-select";

const inviteSchema = z.object({
  email: z.email({ error: identityFr.signIn.invalidEmail }),
  role: z.enum(ORGANIZATION_ROLES).exclude(["owner"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

export const INVITE_EMAIL_INPUT_ID = "invite-email";

export const InviteMemberForm = () => {
  const invite = useInviteMember();
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "technician" },
  });

  const { field: role } = useController({ control: form.control, name: "role" });

  const submit = form.handleSubmit(async (values) => {
    await invite.mutateAsync(values).then(
      () => form.reset({ email: "", role: values.role }),
      () => undefined,
    );
  });

  const emailError = form.formState.errors.email?.message;
  return (
    <form className="flex flex-col gap-4 rounded-lg border p-4" onSubmit={submit} noValidate>
      <h2 className="text-lg font-bold">{identityFr.invite.title}</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor={INVITE_EMAIL_INPUT_ID}>{identityFr.invite.emailLabel}</Label>
        <Input
          id={INVITE_EMAIL_INPUT_ID}
          type="email"
          inputMode="email"
          autoComplete="off"
          className="h-12 text-base"
          aria-invalid={emailError !== undefined}
          {...form.register("email")}
        />
        {emailError === undefined ? null : <p className="text-sm text-destructive">{emailError}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-role">{identityFr.invite.roleLabel}</Label>
        <RoleSelect
          id="invite-role"
          label={identityFr.invite.roleLabel}
          value={role.value}
          onChange={role.onChange}
        />
      </div>
      <Button type="submit" className="h-12 text-base" disabled={invite.isPending}>
        {invite.isPending ? identityFr.invite.sending : identityFr.invite.submit}
      </Button>
    </form>
  );
};
