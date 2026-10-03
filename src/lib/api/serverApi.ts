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

function createServerApi({ forwardToken }: { forwardToken: boolean }) {
  return ofetch.create({
    retry: 0,
    async onRequest({ options }) {
      options.baseURL = backendBaseUrl();
      const token = forwardToken ? (await cookies()).get("accessToken")?.value : undefined;
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
}

/** Server-side client. Sends the access token from the httpOnly cookie as a Bearer header. */
export const serverApi = createServerApi({ forwardToken: true });

/** Same client without the token: the guest view of public reads, identical for every viewer. */
export const serverGuestApi = createServerApi({ forwardToken: false });
