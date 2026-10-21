import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fr } from "@/fr";
import { authClient } from "@/lib/auth-client";
import { toastApiError } from "@/lib/errors";
import { identityFr } from "../fr";
import { identityApi } from "../identity-api";

const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: fr.errors.messages.invalid_organization_name })
    .max(100, { error: fr.errors.messages.invalid_organization_name }),
});

type OrganizationValues = z.infer<typeof organizationSchema>;

export const CreateOrganizationForm = () => {
  const navigate = useNavigate();
  const form = useForm<OrganizationValues>({ resolver: zodResolver(organizationSchema) });

  const submit = form.handleSubmit(async ({ name }) => {
    const result = await identityApi.createOrganization(name);
    if (!result.isOk) {
      toastApiError(result.error);
      return;
    }
    await authClient.organization.setActive({ organizationId: result.value.organization.id });
    toast.success(identityFr.newOrganization.created(result.value.organization.name));
    await navigate({ to: "/equipe" });
  });

  const nameError = form.formState.errors.name?.message;
  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <h1 className="text-2xl font-bold">{identityFr.newOrganization.title}</h1>
      <p className="text-muted-foreground">{identityFr.newOrganization.subtitle}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="organization-name">{identityFr.newOrganization.nameLabel}</Label>
        <Input
          id="organization-name"
          autoComplete="organization"
          placeholder={identityFr.newOrganization.namePlaceholder}
          className="h-12 text-base"
          aria-invalid={nameError !== undefined}
          {...form.register("name")}
        />
        {nameError === undefined ? null : <p className="text-sm text-destructive">{nameError}</p>}
      </div>
      <Button type="submit" className="h-12 text-base" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? identityFr.newOrganization.creating
          : identityFr.newOrganization.submit}
      </Button>
    </form>
  );
};
