import { ORGANIZATION_ROLES } from "@passalio/shared";
import * as z from "zod";
import {
  ORGANIZATION_NAME_MAX_LENGTH,
  ORGANIZATION_NAME_MIN_LENGTH,
} from "../domain/organization-name";

export const createOrganizationBody = z.object({
  name: z.string().min(ORGANIZATION_NAME_MIN_LENGTH).max(ORGANIZATION_NAME_MAX_LENGTH),
});

export const inviteMemberBody = z.object({
  email: z.email().max(254),
  role: z.enum(ORGANIZATION_ROLES),
});

export const changeMemberRoleBody = z.object({
  role: z.enum(ORGANIZATION_ROLES),
});

export const transferOwnershipBody = z.object({
  memberId: z.uuid(),
});

export const listMembersQuery = z.object({
  cursor: z.uuid().optional(),
});

export const memberParams = z.object({
  memberId: z.uuid(),
});

export const invitationParams = z.object({
  organizationId: z.uuid(),
  invitationId: z.uuid(),
});
