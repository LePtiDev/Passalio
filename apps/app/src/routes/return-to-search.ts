import * as z from "zod";

export const returnToSearch = z.object({
  retour: z
    .string()
    .regex(/^\/(?!\/)/)
    .optional(),
});
