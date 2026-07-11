import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** Category of a document attached to a pet. */
export type PetDocumentCategory = "exam" | "prescription" | "report" | "other";

/** A document (exam, prescription, report, other) attached to a pet. */
export interface PetDocument {
  id: number;
  pet_id: number;
  category: PetDocumentCategory;
  name: string;
  file_url: string;
  created_at: string;
  updated_at: string;
}

/** Payload for uploading a document. */
export interface UploadDocumentPayload {
  category: PetDocumentCategory;
  name: string;
  file: File;
}

/**
 * Provides mutations to upload and delete a pet's attached documents.
 * Invalidates the pet's cached detail on every mutation.
 *
 * @param petId - The owning pet's id.
 * @returns Upload/delete mutators and their pending states.
 */
export function usePetDocuments(petId: number | string) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["pet", String(petId)] });

  const uploadDocument = useMutation({
    mutationFn: async (data: UploadDocumentPayload) => {
      const formData = new FormData();
      formData.append("category", data.category);
      formData.append("name", data.name);
      formData.append("file", data.file);
      const response = await apiClient.post(`/pets/${petId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data as PetDocument;
    },
    onSuccess: invalidate,
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/pets/${petId}/documents/${id}`);
      return response.data;
    },
    onSuccess: invalidate,
  });

  return {
    uploadDocument: uploadDocument.mutateAsync,
    isUploading: uploadDocument.isPending,
    deleteDocument: deleteDocument.mutateAsync,
    isDeleting: deleteDocument.isPending,
  };
}
