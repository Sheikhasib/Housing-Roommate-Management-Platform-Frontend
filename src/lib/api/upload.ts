import { ApiError, toApiError } from "@/lib/api/apiError";
import type { ApiSuccess } from "@/types/api";

interface UploadOptions {
  method?: "POST" | "PATCH" | "PUT";
  onProgress?: (percent: number) => void;
}

/**
 * Uploads multipart form data with progress. The only allowed non-ofetch call to the backend,
 * because ofetch cannot report upload progress. `url` is relative to /api/v1, e.g. "/users/me".
 */
export function uploadWithProgress<T>(
  url: string,
  formData: FormData,
  { method = "POST", onProgress }: UploadOptions = {},
): Promise<ApiSuccess<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `/api/v1${url.startsWith("/") ? url : `/${url}`}`);
    xhr.withCredentials = true;
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(xhr.response as ApiSuccess<T>);
      } else {
        reject(toApiError(xhr.status, xhr.response));
      }
    };
    xhr.onerror = () =>
      reject(new ApiError(0, "Network error. Check your connection and try again"));
    xhr.onabort = () => reject(new ApiError(0, "Upload cancelled"));

    xhr.send(formData);
  });
}
