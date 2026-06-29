import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Pet } from "./usePets";
import { Recipe } from "./useRecipes";
import { Subscription } from "./useSubscriptions";

/** Payment invoice attached to an order. */
export interface Invoice {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  /** pending | paid | failed | cancelled */
  status: "pending" | "paid" | "failed" | "cancelled";
  due_date?: string;
  paid_at?: string;
  payment_method?: string;
  reference?: string;
  created_at: string;
  updated_at: string;
}

/** A single recipe line within an order. */
export interface OrderItem {
  id: number;
  order_id: number;
  pet_id?: number;
  recipe_id: number;
  unit_price: number;
  quantity: number;
  recipe?: Recipe;
  pet?: Pet;
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
  scheduled_reposicao_date?: string;
  created_at: string;
  updated_at: string;

  pet?: Pet;
  recipe?: Recipe;
  subscription?: Subscription;
  invoice?: Invoice;
  items?: OrderItem[];
  user?: { id: number; name: string; email: string };
}

/** One item in the order creation payload — recipe + optional originating pet. */
export interface OrderItemPayload {
  recipe_id: number;
  pet_id?: number;
  /** When true, a recurring subscription will be created for this item. */
  subscribe?: boolean;
}

/** Payload for creating a new order. */
export interface CreateOrderPayload {
  items: OrderItemPayload[];
  delivery_address?: string;
}

/**
 * Fetches a single order by ID with full relations (items, recipe ingredients, pet).
 *
 * @param id - The order ID to fetch.
 * @returns The order, loading state, error, and an update mutator.
 */
export function useOrder(id: string | number) {
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["orders", String(id)],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data.data as Order;
    },
    enabled: !!id,
  });

  const updateOrder = useMutation({
    mutationFn: async (data: Partial<Order>) => {
      const response = await apiClient.put(`/orders/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", String(id)] });
    },
  });

  return {
    order,
    isLoading,
    error,
    updateOrder: updateOrder.mutateAsync,
    isUpdating: updateOrder.isPending,
  };
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if ((result?.subscriptions_created ?? 0) > 0) {
        queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      }
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
