import { can } from "@passalio/shared";
import { useCallback } from "react";
import { useActor } from "./use-actor";
import { useDocumentSettings } from "./use-document-settings";
import { useOrganization } from "./use-organization";

export const useSettingsData = () => {
  const organization = useOrganization();
  const settings = useDocumentSettings();
  const { data: actor } = useActor();
  const { refetch: refetchOrganization } = organization;
  const { refetch: refetchSettings } = settings;
  const retry = useCallback(() => {
    void refetchOrganization();
    void refetchSettings();
  }, [refetchOrganization, refetchSettings]);
  return {
    data:
      organization.data === undefined || settings.data === undefined
        ? undefined
        : { organization: organization.data, settings: settings.data },
    isError: organization.isError || settings.isError,
    error: organization.error ?? settings.error,
    retry,
    canEdit: actor !== undefined && can(actor, "organization:update"),
  };
};
