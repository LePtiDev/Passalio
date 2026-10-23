import type {
  ProspectCompanyChanges,
  ProspectCompanyFields,
  ProspectContactChanges,
  ProspectContactFields,
  ProspectNote,
  ProspectStage,
} from "@passalio/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unwrap } from "@/lib/api-client";
import { salesFr } from "../fr";
import { salesApi } from "../sales-api";
import { SALES_KEY } from "./use-sales-queries";

const useRefreshSales = () => {
  const queryClient = useQueryClient();
  return async (removedId?: string) => {
    if (removedId !== undefined) {
      queryClient.removeQueries({
        queryKey: SALES_KEY,
        predicate: ({ queryKey }) => queryKey.includes(removedId),
      });
    }
    await queryClient.invalidateQueries({
      queryKey: SALES_KEY,
      predicate: ({ queryKey }) => removedId === undefined || !queryKey.includes(removedId),
    });
  };
};

type CompanyTarget = { readonly companyId: string; readonly name: string };

export const useCreateCompany = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async (fields: ProspectCompanyFields) =>
      unwrap(await salesApi.createCompany(fields)),
    onSuccess: async (_created, fields) => {
      toast.success(salesFr.companyForm.created(fields.name));
      await refresh();
    },
  });
};

export const useUpdateCompany = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async ({
      companyId,
      changes,
    }: {
      readonly companyId: string;
      readonly changes: ProspectCompanyChanges;
    }) => unwrap(await salesApi.updateCompany(companyId, changes)),
    onSuccess: async () => {
      toast.success(salesFr.companyForm.saved);
      await refresh();
    },
  });
};

export const useDeleteCompany = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async ({ companyId }: CompanyTarget) =>
      unwrap(await salesApi.deleteCompany(companyId)),
    onSuccess: async (_value, { companyId, name }) => {
      toast.success(salesFr.companyForm.deleted(name));
      await refresh(companyId);
    },
  });
};

export const useChangeStage = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async ({ companyId, stage }: CompanyTarget & { readonly stage: ProspectStage }) =>
      unwrap(await salesApi.changeStage(companyId, stage)),
    onSuccess: async (_value, { name, stage }) => {
      toast.success(salesFr.stageReached(name, stage));
      await refresh();
    },
  });
};

export const useAddNote = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async ({
      companyId,
      note,
    }: {
      readonly companyId: string;
      readonly note: ProspectNote;
    }) => unwrap(await salesApi.addNote(companyId, note)),
    onSuccess: async () => {
      toast.success(salesFr.history.noteAdded);
      await refresh();
    },
  });
};

type ContactTarget = { readonly contactId: string; readonly name: string };

export const useAddContact = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async ({
      companyId,
      fields,
    }: {
      readonly companyId: string;
      readonly fields: ProspectContactFields;
    }) => unwrap(await salesApi.addContact(companyId, fields)),
    onSuccess: async (contact) => {
      toast.success(salesFr.contactForm.created(contact.name));
      await refresh();
    },
  });
};

export const useUpdateContact = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async ({
      contactId,
      changes,
    }: {
      readonly contactId: string;
      readonly changes: ProspectContactChanges;
    }) => unwrap(await salesApi.updateContact(contactId, changes)),
    onSuccess: async () => {
      toast.success(salesFr.contactForm.saved);
      await refresh();
    },
  });
};

export const useDeleteContact = () => {
  const refresh = useRefreshSales();
  return useMutation({
    mutationFn: async ({ contactId }: ContactTarget) =>
      unwrap(await salesApi.deleteContact(contactId)),
    onSuccess: async (_value, { contactId, name }) => {
      toast.success(salesFr.contactForm.deleted(name));
      await refresh(contactId);
    },
  });
};
