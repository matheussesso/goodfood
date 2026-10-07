import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { apiClient } from "@/lib/api-client";
import { axiosResponse, createTestQueryClient, createWrapper } from "@/test/query-utils";
import { usePetDocuments, PetDocument } from "./usePetDocuments";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  API_BASE_URL: "http://localhost:8000/api",
  ensureCsrfCookie: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const petDocument = { id: 1, pet_id: 7, category: "exam", name: "Blood test" } as PetDocument;

describe("usePetDocuments", () => {
  it("uploads the document as multipart FormData and invalidates the pet detail", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(axiosResponse({ success: true, data: petDocument }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const file = new File(["content"], "exam.pdf", { type: "application/pdf" });

    const { result } = renderHook(() => usePetDocuments(7), { wrapper: createWrapper(queryClient) });

    let uploaded: PetDocument | undefined;
    await act(async () => {
      uploaded = await result.current.uploadDocument({ category: "exam", name: "Blood test", file });
    });

    expect(uploaded).toEqual(petDocument);
    expect(apiClient.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = vi.mocked(apiClient.post).mock.calls[0];
    expect(url).toBe("/pets/7/documents");
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(formData.get("category")).toBe("exam");
    expect(formData.get("name")).toBe("Blood test");
    expect((formData.get("file") as File).name).toBe("exam.pdf");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pet", "7"] });
  });

  it("deletes a document and invalidates the pet detail", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(axiosResponse({ success: true }));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePetDocuments("7"), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.deleteDocument(1);
    });

    expect(apiClient.delete).toHaveBeenCalledWith("/pets/7/documents/1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["pet", "7"] });
  });

  it("does not invalidate when the upload fails", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("422"));
    const queryClient = createTestQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const file = new File(["x"], "x.pdf");

    const { result } = renderHook(() => usePetDocuments(7), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await expect(
        result.current.uploadDocument({ category: "other", name: "x", file })
      ).rejects.toThrow("422");
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});
