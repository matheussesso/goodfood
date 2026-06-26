import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Pet {
  id: number;
  user_id: number;
  name: string;
  type?: "dog" | "cat";
  breed?: string;
  weight?: number;
  age?: number;
  birth_date?: string;
  restrictions?: string;
  allergies?: string;
  special_needs?: string;
  created_at: string;
  updated_at: string;
}

export function usePets() {
  const queryClient = useQueryClient();

  const { data: pets, isLoading, error } = useQuery({
    queryKey: ["pets"],
    queryFn: async () => {
      const response = await apiClient.get("/pets");
      return response.data.data as Pet[];
    },
  });

  const createPetMutation = useMutation({
    mutationFn: async (newPet: Partial<Pet>) => {
      const response = await apiClient.post("/pets", newPet);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });

  const updatePetMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Pet> & { id: number }) => {
      const response = await apiClient.put(`/pets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });

  const deletePetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/pets/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
  });

  return {
    pets,
    isLoading,
    error,
    createPet: createPetMutation.mutateAsync,
    isCreating: createPetMutation.isPending,
    updatePet: updatePetMutation.mutateAsync,
    isUpdating: updatePetMutation.isPending,
    deletePet: deletePetMutation.mutateAsync,
    isDeleting: deletePetMutation.isPending,
  };
}
