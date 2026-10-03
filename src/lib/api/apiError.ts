import type { ApiErrorBody, ApiErrorItem } from "@/types/api";

const FALLBACK_MESSAGE = "Something went wrong";

export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiErrorItem[];

  constructor(status: number, message: string, errors: ApiErrorItem[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function pickMessage(status: number, body: Partial<ApiErrorBody> | undefined): string {
  if (status === 413) return "File too large. Maximum 8 MB per file";
  if (status === 429) return "Too many attempts, try again later";
  return body?.errors?.[0]?.message || body?.message || FALLBACK_MESSAGE;
}

/** Builds an ApiError from a status and a parsed (or missing) backend error body. */
export function toApiError(status: number, body?: unknown): ApiError {
  const parsed = body && typeof body === "object" ? (body as Partial<ApiErrorBody>) : undefined;
  const errors = Array.isArray(parsed?.errors) ? parsed.errors : [];
  return new ApiError(status, pickMessage(status, parsed), errors);
}
