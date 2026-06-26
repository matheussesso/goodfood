import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface GeneralSettings {
  ingredient_cost_days_division: number;
  production_fixed_value: number;
  production_days_division: number;
  production_weight_multiplier: number;
  logistics_fixed_multiplier: number;
  reserve_margin_fixed_value: number;
  reserve_margin_transfer_multiplier: number;
  gfp_mkt_fixed_value: number;
  gfp_mkt_fixed_multiplier: number;
  fiscal_fixed_multiplier: number;
  charge_fixed_value: number;
  charge_fixed_multiplier: number;
  schedule_fixed_value: number;
  schedule_fixed_multiplier: number;
  difficulty_fixed_value: number;
}

export function useSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: GeneralSettings }>("/settings");
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: Partial<GeneralSettings>) => {
      const response = await apiClient.put<{ success: boolean; data: GeneralSettings }>("/settings", settings);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return {
    settings: data,
    isLoading,
    error,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
