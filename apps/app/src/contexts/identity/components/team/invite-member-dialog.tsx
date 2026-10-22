import { zodResolver } from "@hookform/resolvers/zod";
import { ORGANIZATION_ROLES } from "@passalio/shared";
import { useCallback } from "react";
import { useController, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { identityFr } from "../../fr";
import { useInviteMember } from "../../hooks/use-team";
import {
  AUTH_ERROR_CLASS,
  AUTH_FIELD_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_SECONDARY_BUTTON_CLASS,
} from "../auth-styles";
import { RoleSelect } from "../role-select";

const inviteSchema = z.object({
  email: z.email({ error: identityFr.fields.invalidEmail }),
  role: z.enum(ORGANIZATION_ROLES).exclude(["owner"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

const DEFAULT_VALUES: InviteValues = { email: "", role: "technician" };

const EMAIL_INPUT_ID = "invite-email";
const ROLE_INPUT_ID = "invite-role";

const text = identityFr.invite;

type InviteMemberDialogProps = {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
};

export const InviteMemberDialog = ({ isOpen, onOpenChange }: InviteMemberDialogProps) => {
  const invite = useInviteMember();
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { field: role } = useController({ control: form.control, name: "role" });
  const { reset } = form;

  const changeOpen = useCallback(
    (next: boolean) => {
      if (!next) {
        reset(DEFAULT_VALUES);
      }
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );
  const close = useCallback(() => changeOpen(false), [changeOpen]);

  const submit = form.handleSubmit(async (values) => {
    await invite.mutateAsync(values).then(close, () => undefined);
  });

  const emailError = form.formState.errors.email?.message;
  return (
    <Dialog open={isOpen} onOpenChange={changeOpen}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg lg:text-base">{text.title}</DialogTitle>
          <DialogDescription className="text-[15px] lg:text-[13px]">{text.text}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={EMAIL_INPUT_ID} className={AUTH_LABEL_CLASS}>
              {text.emailLabel}
            </Label>
            <Input
              id={EMAIL_INPUT_ID}
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder={identityFr.fields.emailPlaceholder}
              className={AUTH_FIELD_CLASS}
              aria-invalid={emailError !== undefined}
              {...form.register("email")}
            />
            {emailError === undefined ? null : <p className={AUTH_ERROR_CLASS}>{emailError}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ROLE_INPUT_ID} className={AUTH_LABEL_CLASS}>
              {text.roleLabel}
            </Label>
            <RoleSelect
              id={ROLE_INPUT_ID}
              label={text.roleLabel}
              value={role.value}
              onChange={role.onChange}
              className="lg:h-10 lg:text-sm lg:data-[size=default]:h-10"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className={AUTH_SECONDARY_BUTTON_CLASS}
              onClick={close}
            >
              {identityFr.team.cancel}
            </Button>
            <Button
              type="submit"
              className={cn(AUTH_PRIMARY_BUTTON_CLASS, "lg:px-4")}
              disabled={invite.isPending}
            >
              {invite.isPending ? text.sending : text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
