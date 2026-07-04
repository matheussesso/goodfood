import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "./useAuth";

/** Payload for updating the authenticated user's profile. */
export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  whatsapp_notifications?: boolean;
}

/** Payload for changing the authenticated user's password. */
export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * Provides mutations to update the current user's profile and password.
 * Syncs updated user data back to the auth store on success.
 *
 * @returns Profile update and password change mutators.
 */
export function useProfile() {
  const { updateUser } = useAuth();

  const profileMutation = useMutation({
    mutationFn: async (data: UpdateProfilePayload) => {
      const response = await apiClient.put("/profile", data);
      return response.data;
    },
    onSuccess: (result) => {
      if (result?.data) {
        updateUser(result.data);
      }
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: UpdatePasswordPayload) => {
      const response = await apiClient.put("/profile/password", data);
      return response.data;
    },
  });

  return {
    updateProfile: profileMutation.mutateAsync,
    isUpdatingProfile: profileMutation.isPending,
    updatePassword: passwordMutation.mutateAsync,
    isUpdatingPassword: passwordMutation.isPending,
  };
}
