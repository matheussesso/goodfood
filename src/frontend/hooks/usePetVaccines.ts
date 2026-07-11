import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** A single vaccination record for a pet. */
export interface PetVaccine {
  id: number;
  pet_id: number;
  name: string;
  application_date: string;
  next_due_date?: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload for creating or updating a vaccine record. */
export interface VaccinePayload {
  name: string;
  application_date: string;
  next_due_date?: string;
}

/**
 * Provides mutations to manage a pet's vaccination records.
 * Invalidates the pet's cached detail on every mutation.
 *
 * @param petId - The owning pet's id.
 * @returns Create/update/delete mutators and their pending states.
 */
export function usePetVaccines(petId: number | string) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["pet", String(petId)] });

  const createVaccine = useMutation({
    mutationFn: async (data: VaccinePayload) => {
      const response = await apiClient.post(`/pets/${petId}/vaccines`, data);
      return response.data.data as PetVaccine;
    },
    onSuccess: invalidate,
  });

  const updateVaccine = useMutation({
    mutationFn: async ({ id, ...data }: VaccinePayload & { id: number }) => {
      const response = await apiClient.put(`/pets/${petId}/vaccines/${id}`, data);
      return response.data.data as PetVaccine;
    },
    onSuccess: invalidate,
  });

  const deleteVaccine = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/pets/${petId}/vaccines/${id}`);
      return response.data;
    },
    onSuccess: invalidate,
  });

  return {
    createVaccine: createVaccine.mutateAsync,
    isCreating: createVaccine.isPending,
    updateVaccine: updateVaccine.mutateAsync,
    isUpdating: updateVaccine.isPending,
    deleteVaccine: deleteVaccine.mutateAsync,
    isDeleting: deleteVaccine.isPending,
  };
}
