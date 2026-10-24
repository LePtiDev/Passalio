import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorCodeLine, toastApiError } from "@/lib/errors";
import { ROLE_LABELS } from "../../fr";
import { ORGANIZATION_QUERY_KEY } from "../../hooks/use-organization";
import { identityApi } from "../../identity-api";
import { onboardingFr } from "../../onboarding-fr";
import { BackButton } from "./back-button";
import { InvitationRow } from "./invitation-row";
import { OnboardingBody, OnboardingFooter, OnboardingHeading } from "./onboarding-layout";
import {
  ONBOARDING_GHOST_BUTTON_CLASS,
  ONBOARDING_PRIMARY_BUTTON_CLASS,
} from "./onboarding-styles";
import { EMPTY_INVITATION, teamFormSchema, type TeamFormValues } from "./team-form-schema";

const text = onboardingFr.team;

const INITIAL_ROWS = 3;

const sendInvitations = async (invitations: TeamFormValues["invitations"]) => {
  const results = await Promise.all(
    invitations.map(({ email, role }) => identityApi.inviteMember(email, role)),
  );
  const failures = results.flatMap((result) => (result.isOk ? [] : [result.error]));
  return { sentCount: results.length - failures.length, firstFailure: failures[0] };
};

const RoleGuide = () => (
  <div className="overflow-hidden rounded-[10px] border border-[#E3E8EF] bg-white">
    {text.roles.map(({ role, text: description }) => (
      <div
        key={role}
        className="flex flex-col gap-0.5 border-b border-[#EEF2F6] px-3.5 py-2.5 text-sm last:border-b-0 sm:flex-row sm:gap-3 lg:text-[13px]"
      >
        <strong className="w-[110px] shrink-0 font-semibold">{ROLE_LABELS[role]}</strong>
        <span className="text-muted-foreground">{description}</span>
      </div>
    ))}
  </div>
);

export const TeamStep = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { invitations: Array.from({ length: INITIAL_ROWS }, () => EMPTY_INVITATION) },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "invitations" });
  const invitations = useWatch({ control: form.control, name: "invitations" });
  const filledCount = invitations.filter(({ email }) => email.trim() !== "").length;

  const completion = useMutation({
    mutationFn: async () => {
      const completed = await identityApi.completeOnboarding();
      if (!completed.isOk) {
        toastApiError(completed.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY });
      await navigate({ to: "/", search: { bienvenue: true } });
    },
  });
  const finish = completion.mutateAsync;

  const submit = form.handleSubmit(async (values) => {
    const toSend = values.invitations.filter(({ email }) => email !== "");
    if (toSend.length > 0) {
      const { sentCount, firstFailure } = await sendInvitations(toSend);
      if (firstFailure !== undefined) {
        const description = errorCodeLine(firstFailure);
        toast.warning(
          text.partlySent(sentCount, toSend.length - sentCount),
          description === undefined ? {} : { description },
        );
      } else {
        toast.success(text.sent(sentCount));
      }
    }
    await finish();
  });

  const addRow = useCallback(() => append(EMPTY_INVITATION), [append]);
  const { errors, isSubmitting } = form.formState;

  return (
    <form className="flex flex-1 flex-col" onSubmit={submit} noValidate>
      <OnboardingBody width="medium">
        <OnboardingHeading step={5} title={text.title} subtitle={text.subtitle} />
        <div className="flex flex-col gap-2">
          <div
            className="hidden grid-cols-[minmax(0,1fr)_180px_40px] gap-2 text-[13px] font-semibold sm:grid"
            aria-hidden="true"
          >
            <span>{text.emailColumn}</span>
            <span>{text.roleColumn}</span>
          </div>
          {fields.map((row, index) => (
            <InvitationRow
              key={row.id}
              index={index}
              control={form.control}
              register={form.register}
              error={errors.invitations?.[index]?.email?.message}
              canRemove={fields.length > 1}
              onRemove={remove}
            />
          ))}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex h-12 items-center gap-1.5 self-start text-sm font-semibold text-success hover:text-[#0B6349] lg:h-9 lg:text-[13px]"
          >
            <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.4} />
            {text.addRow}
          </button>
        </div>
        <RoleGuide />
      </OnboardingBody>
      <OnboardingFooter width="medium">
        <BackButton to={4} />
        <span className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <Button
            type="button"
            variant="ghost"
            className={ONBOARDING_GHOST_BUTTON_CLASS}
            onClick={() => completion.mutate()}
            disabled={isSubmitting || completion.isPending}
          >
            {onboardingFr.layout.later}
          </Button>
          <Button
            type="submit"
            className={ONBOARDING_PRIMARY_BUTTON_CLASS}
            disabled={isSubmitting || completion.isPending || filledCount === 0}
          >
            {isSubmitting ? text.sending : text.send(filledCount)}
          </Button>
        </span>
      </OnboardingFooter>
    </form>
  );
};
