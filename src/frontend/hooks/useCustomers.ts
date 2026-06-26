import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "./usePets";
import { Order } from "./useOrders";
import { Subscription } from "./useSubscriptions";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  pets_count?: number;
  orders_count?: number;
  pets?: Pet[];
  orders?: Order[];
  subscriptions?: Subscription[];
}

export function useCustomers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Customer[] }>("/customers");
      return response.data.data;
    },
  });

  return {
    customers: data || [],
    isLoading,
    error,
  };
}

export function useCustomer(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  return {
    customer: data,
    isLoading,
    error,
  };
}
