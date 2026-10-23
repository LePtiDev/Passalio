import { zodResolver } from "@hookform/resolvers/zod";
import { PLATFORM_ROLES } from "@passalio/shared";
import { useCallback } from "react";
import { useController, useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorOf } from "@/lib/api-client";
import { errorMessage, toastApiError } from "@/lib/errors";
import { useInviteTeammate } from "../../hooks/use-platform-team";
import { teamFr } from "../../team-fr";
import { RoleChoice } from "./role-choice";
import { TeamDialog } from "./team-dialog";

const text = teamFr.inviteDialog;

const inviteSchema = z.object({
  email: z.email({ error: text.invalidEmail }),
  role: z.enum(PLATFORM_ROLES),
});

type InviteValues = z.infer<typeof inviteSchema>;

const DEFAULT_VALUES: InviteValues = { email: "", role: "admin" };

const EMAIL_INPUT_ID = "teammate-email";

type InviteTeammateDialogProps = {
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
};

export const InviteTeammateDialog = ({ isOpen, onOpenChange }: InviteTeammateDialogProps) => {
  const invite = useInviteTeammate();
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const { field: role } = useController({ control: form.control, name: "role" });
  const { reset, setError } = form;

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
    await invite.mutateAsync(values).then(close, (error: unknown) => {
      const apiError = apiErrorOf(error);
      if (apiError.code === "already_in_team") {
        setError("email", { message: errorMessage(apiError.code) });
        return;
      }
      toastApiError(apiError);
    });
  });

  const emailError = form.formState.errors.email?.message;
  return (
    <TeamDialog
      isOpen={isOpen}
      title={text.title}
      description={text.text}
      submitLabel={invite.isPending ? text.sending : text.submit}
      isSubmitting={invite.isPending}
      onOpenChange={changeOpen}
      onCancel={close}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={EMAIL_INPUT_ID} className="text-sm font-semibold lg:text-[13px]">
          {text.emailLabel}
        </Label>
        <Input
          id={EMAIL_INPUT_ID}
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder={text.emailPlaceholder}
          className="h-12 rounded-[10px] border-[#D5DDE6] text-base aria-invalid:border-[#B42318] lg:h-10 lg:rounded-lg lg:text-sm"
          aria-invalid={emailError !== undefined}
          aria-describedby={emailError === undefined ? undefined : `${EMAIL_INPUT_ID}-error`}
          {...form.register("email")}
        />
        {emailError === undefined ? null : (
          <p id={`${EMAIL_INPUT_ID}-error`} className="text-sm text-[#B42318] lg:text-[13px]">
            {emailError}
          </p>
        )}
      </div>
      <RoleChoice name="teammate-role" value={role.value} onChange={role.onChange} />
    </TeamDialog>
  );
};
