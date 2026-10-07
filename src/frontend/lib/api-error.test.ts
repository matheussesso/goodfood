import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { getApiErrorMessage } from "./api-error";

/** Builds an AxiosError whose response body is the given value. */
function axiosError(body: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { data: body, status: 422, statusText: "", headers: {}, config } as AxiosResponse;
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, response);
}

describe("getApiErrorMessage", () => {
  it("returns the backend message from an Axios error response", () => {
    const error = axiosError({ success: false, message: "Email already taken" });

    expect(getApiErrorMessage(error, "Fallback")).toBe("Email already taken");
  });

  it("falls back when the response body has no message", () => {
    expect(getApiErrorMessage(axiosError({ success: false }), "Fallback")).toBe("Fallback");
  });

  it("falls back when the backend message is empty", () => {
    expect(getApiErrorMessage(axiosError({ message: "" }), "Fallback")).toBe("Fallback");
  });

  it("falls back when the Axios error has no response (network failure)", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");

    expect(getApiErrorMessage(error, "Fallback")).toBe("Fallback");
  });

  it("falls back for non-Axios errors and arbitrary values", () => {
    expect(getApiErrorMessage(new Error("boom"), "Fallback")).toBe("Fallback");
    expect(getApiErrorMessage("oops", "Fallback")).toBe("Fallback");
    expect(getApiErrorMessage(null, "Fallback")).toBe("Fallback");
    expect(getApiErrorMessage(undefined, "Fallback")).toBe("Fallback");
  });
});
