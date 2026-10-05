import { apiClient } from "@/lib/api/apiClient";
import type { ApiSuccess } from "@/types/api";
import type { ContactMessageInput } from "@/validation/contact";

export async function sendContactMessage(input: ContactMessageInput): Promise<void> {
  await apiClient<ApiSuccess<unknown>>("/contact", { method: "POST", body: input });
}
