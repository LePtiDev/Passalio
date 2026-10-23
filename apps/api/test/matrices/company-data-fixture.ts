import * as z from "zod";
import type { TestPlatform } from "../test-platform";
import { createOrganization, joinOrganization } from "./matrix-sessions";
import { randomSampleIds, type SampleIds } from "./sample-request";

const idResponse = z.object({ id: z.string() });
const createdCustomer = z.object({ customer: idResponse, site: idResponse });
const createdEquipment = z.object({ equipment: idResponse });
const createdPhoto = z.object({ photo: idResponse });
const membersResponse = z.object({
  members: z.array(z.object({ id: z.string(), email: z.string() })),
});
const invitationsResponse = z.object({
  invitations: z.array(z.object({ id: z.string(), email: z.string() })),
});

export const PHOTO_BYTES = new Uint8Array([255, 216, 255, 224]);
export const LOGO_BYTES = new Uint8Array([137, 80, 78, 71]);

const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

const parsed = async <Schema extends z.ZodType>(
  schema: Schema,
  response: Response,
): Promise<z.infer<Schema>> => schema.parse(await response.json());

export type CompanyData = {
  readonly ownerCookie: string;
  readonly technicianEmail: string;
  readonly pendingEmail: string;
  readonly ids: SampleIds;
};

export const seedCompanyData = async (
  platform: TestPlatform,
  prefix: string,
): Promise<CompanyData> => {
  const ownerCookie = await platform.signIn(`patron-${prefix}@example.fr`);
  const organizationId = await createOrganization(platform, ownerCookie, `Ramonage ${prefix}`);
  const technicianEmail = `technicien-${prefix}@example.fr`;
  await joinOrganization(platform, ownerCookie, organizationId, technicianEmail, "technician");
  const pendingEmail = `en-attente-${prefix}@example.fr`;
  await platform.request(
    "/api/invitations",
    json({ email: pendingEmail, role: "secretary" }),
    ownerCookie,
  );
  const { members } = await parsed(
    membersResponse,
    await platform.request("/api/members", {}, ownerCookie),
  );
  const { invitations } = await parsed(
    invitationsResponse,
    await platform.request("/api/invitations", {}, ownerCookie),
  );
  const { customer, site } = await parsed(
    createdCustomer,
    await platform.request(
      "/api/customers",
      json({
        customer: { kind: "individual", lastName: `Client ${prefix}` },
        site: { address: "1 rue Haute", postalCode: "75004", city: "Paris", buildingType: "house" },
      }),
      ownerCookie,
    ),
  );
  const { equipment } = await parsed(
    createdEquipment,
    await platform.request(
      `/api/sites/${site.id}/equipments`,
      json({ kind: "boiler", brand: "Marque d'origine" }),
      ownerCookie,
    ),
  );
  const { photo } = await parsed(
    createdPhoto,
    await platform.request(
      `/api/equipments/${equipment.id}/photos?kind=plate`,
      { method: "POST", body: PHOTO_BYTES, headers: { "content-type": "image/jpeg" } },
      ownerCookie,
    ),
  );
  await platform.request(
    "/api/organization/logo",
    { method: "PUT", body: LOGO_BYTES, headers: { "content-type": "image/png" } },
    ownerCookie,
  );
  return {
    ownerCookie,
    technicianEmail,
    pendingEmail,
    ids: {
      ...randomSampleIds(),
      organizationId,
      invitationId: invitations.find(({ email }) => email === pendingEmail)?.id ?? "",
      memberId: members.find(({ email }) => email === technicianEmail)?.id ?? "",
      customerId: customer.id,
      siteId: site.id,
      equipmentId: equipment.id,
      photoId: photo.id,
    },
  };
};
