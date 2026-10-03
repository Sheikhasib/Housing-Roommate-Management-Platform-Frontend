import { cookies } from "next/headers";
import { ofetch } from "ofetch";
import { ApiError, toApiError } from "@/lib/api/apiError";

function backendBaseUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error("BACKEND_API_URL is not set. Add it to .env.local (see .env.example).");
  }
  return `${url.replace(/\/+$/, "")}/api/v1`;
}

/** Server-side client. Sends the access token from the httpOnly cookie as a Bearer header. */
export const serverApi = ofetch.create({
  retry: 0,
  async onRequest({ options }) {
    options.baseURL = backendBaseUrl();
    const token = (await cookies()).get("accessToken")?.value;
    if (token) {
      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token}`);
      options.headers = headers;
    }
  },
  onResponseError({ response }) {
    throw toApiError(response.status, response._data);
  },
  onRequestError() {
    throw new ApiError(0, "Could not reach the server. Try again");
  },
});
