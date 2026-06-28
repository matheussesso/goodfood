import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "./usePets";
import { Recipe } from "./useRecipes";
import { Subscription } from "./useSubscriptions";

/** A single recipe line within an order. */
export interface OrderItem {
  id: number;
  order_id: number;
  recipe_id: number;
  unit_price: number;
  quantity: number;
  recipe?: Recipe;
}

/** Customer order header. */
export interface Order {
  id: number;
  user_id: number;
  pet_id?: number;
  recipe_id?: number;
  subscription_id?: number;
  total_price: number;
  status: string;
  delivery_address?: string;
  delivery_date?: string;
  created_at: string;
  updated_at: string;

  pet?: Pet;
  recipe?: Recipe;
  subscription?: Subscription;
  items?: OrderItem[];
  user?: { id: number; name: string; email: string };
}

/** Payload for creating a new order. */
export interface CreateOrderPayload {
  pet_id?: number;
  recipe_ids: number[];
  delivery_address?: string;
  delivery_date?: string;
}

/**
 * Provides order data and mutations for the current user (or all users for admins).
 *
 * @returns Orders list, loading state, and create/update mutators.
 */
export function useOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await apiClient.get("/orders");
      return response.data.data as Order[];
    },
  });

  const createOrder = useMutation({
    mutationFn: async (data: CreateOrderPayload) => {
      const response = await apiClient.post("/orders", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Order> & { id: number }) => {
      const response = await apiClient.put(`/orders/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return {
    orders,
    isLoading,
    error,
    createOrder: createOrder.mutateAsync,
    isCreating: createOrder.isPending,
    updateOrder: updateOrder.mutateAsync,
    isUpdating: updateOrder.isPending,
  };
}
