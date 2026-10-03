import { ofetch } from "ofetch";
import { ApiError, toApiError } from "@/lib/api/apiError";

/** Browser client. Calls the same-origin /api/v1 path, which next.config.ts rewrites to the backend. */
export const apiClient = ofetch.create({
  baseURL: "/api/v1",
  credentials: "include",
  retry: 0,
  onResponseError({ response }) {
    throw toApiError(response.status, response._data);
  },
  onRequestError() {
    throw new ApiError(0, "Network error. Check your connection and try again");
  },
});
