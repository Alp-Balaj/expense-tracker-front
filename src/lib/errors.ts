import { isAxiosError } from "axios";

/**
 * Extracts a human-readable message from a failed API call:
 * prefers the server's response body, falls back to the axios/Error
 * message, then to the supplied default.
 */
export function getApiErrorMessage(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const data = e.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const d = data as { detail?: string; message?: string; title?: string };
      const msg = d.detail ?? d.message ?? d.title;
      if (msg) return msg;
    }
    return e.message || fallback;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
