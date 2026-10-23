import type * as z from "zod";

export type SampleIds = {
  readonly organizationId: string;
  readonly invitationId: string;
  readonly memberId: string;
  readonly customerId: string;
  readonly siteId: string;
  readonly equipmentId: string;
  readonly photoId: string;
  readonly companyId: string;
  readonly contactId: string;
  readonly teammateUserId: string;
  readonly teamInvitationId: string;
};

export type SampleRequest = { readonly path: string; readonly init: RequestInit };

export type SampleBuilder = (ids: SampleIds) => SampleRequest;

export const randomSampleIds = (): SampleIds => ({
  organizationId: crypto.randomUUID(),
  invitationId: crypto.randomUUID(),
  memberId: crypto.randomUUID(),
  customerId: crypto.randomUUID(),
  siteId: crypto.randomUUID(),
  equipmentId: crypto.randomUUID(),
  photoId: crypto.randomUUID(),
  companyId: crypto.randomUUID(),
  contactId: crypto.randomUUID(),
  teammateUserId: crypto.randomUUID(),
  teamInvitationId: crypto.randomUUID(),
});

export const read = (path: string): SampleRequest => ({ path, init: { method: "GET" } });

export const withoutBody = (method: "POST" | "DELETE", path: string): SampleRequest => ({
  path,
  init: { method },
});

export const withJson = <Schema extends z.ZodType>(
  method: "POST" | "PATCH",
  path: string,
  schema: Schema,
  body: z.input<Schema>,
): SampleRequest => {
  schema.parse(body);
  return { path, init: { method, body: JSON.stringify(body) } };
};

export const withBytes = (
  method: "POST" | "PUT",
  path: string,
  contentType: string,
): SampleRequest => ({
  path,
  init: {
    method,
    body: new Uint8Array([255, 216, 255, 224]),
    headers: { "content-type": contentType },
  },
});
