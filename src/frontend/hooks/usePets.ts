import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Recipe } from "./useRecipes";
import { Order } from "./useOrders";
import { Subscription } from "./useSubscriptions";
import { PetVaccine } from "./usePetVaccines";
import { PetDocument } from "./usePetDocuments";

export interface Pet {
  id: number;
  user_id: number;
  name: string;
  type?: "dog" | "cat";
  sex?: "male" | "female";
  breed?: string;
  weight?: number;
  age?: number;
  age_years?: number;
  age_months?: number;
  birth_date?: string;
  body_condition?: string;
  activity_level?: string;
  restrictions?: string;
  allergies?: string;
  special_needs?: string;
  photo_url?: string;
  neutered?: boolean;
  microchip_number?: string;
  vet_name?: string;
  vet_phone?: string;
  created_at: string;
  updated_at: string;
  recipes?: Recipe[];
  orders?: Order[];
  subscriptions?: Subscription[];
  vaccines?: PetVaccine[];
  documents?: PetDocument[];
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

export function usePet(id: string) {
  const { data: pet, isLoading, error } = useQuery({
    queryKey: ["pet", id],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Pet }>(`/pets/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  return {
    pet,
    isLoading,
    error,
  };
}
