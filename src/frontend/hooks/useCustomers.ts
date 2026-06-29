import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "./usePets";
import { Order } from "./useOrders";
import { Subscription } from "./useSubscriptions";

import { Recipe } from "./useRecipes";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  created_at: string;
  pets_count?: number;
  orders_count?: number;
  pets?: Pet[];
  orders?: Order[];
  subscriptions?: Subscription[];
  recipes?: Recipe[];
}

export function useCustomers(search?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      const params = search ? { search } : {};
      const response = await apiClient.get<{ success: boolean; data: Customer[] }>("/customers", { params });
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

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Customer> }) => {
      const response = await apiClient.put<{ success: boolean; data: Customer }>(`/customers/${id}`, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", String(data.id)] });
    },
  });
}

/** Payload for creating a new customer via admin. */
export interface CreateCustomerPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

/**
 * Mutation hook for creating a new customer (admin only).
 *
 * @returns Mutation object with `mutateAsync` for submitting the new customer form.
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      const response = await apiClient.post<{ success: boolean; data: Customer }>("/customers", payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
