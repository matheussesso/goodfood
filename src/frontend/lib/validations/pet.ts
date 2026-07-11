import { z } from "zod";

/**
 * Validation schema for the pet create/edit form. Mirrors the backend
 * StorePetRequest / UpdatePetRequest rules that apply to the UI.
 *
 * `weight`/`age` are registered with RHF's `setValueAs` (not `valueAsNumber`)
 * so an emptied input becomes `undefined` instead of `NaN` before it ever
 * reaches this schema — keeps the field genuinely optional.
 */
export const petFormSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.enum(["dog", "cat"]),
  sex: z.enum(["male", "female"]),
  breed: z.string().max(255).optional(),
  weight: z.number().min(0).max(120).optional(),
  age: z.number().int().min(0).max(360).optional(),
  restrictions: z.string().max(1000).optional(),
  allergies: z.string().max(1000).optional(),
  special_needs: z.string().max(1000).optional(),
  photo_url: z.string().optional(),
  neutered: z.boolean(),
  microchip_number: z.string().regex(/^\d{9,15}$/).optional().or(z.literal("")),
  vet_name: z.string().max(255).optional(),
  vet_phone: z.string().optional(),
});

/** Form values of the pet create/edit form. */
export type PetFormData = z.infer<typeof petFormSchema>;
