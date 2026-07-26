import axios from "axios";
import { api } from "./api";
import type { LoginRequest, SignUpRequest, AuthResponse } from "../Models/UserAuth";

// The account endpoints answer failures with { message, errors: [...] } where
// errors carries Identity's human-readable descriptions ("Incorrect password.",
// password policy violations, "Username '…' is already taken."). Surface those;
// axios's own err.message is useless to the user.
function accountErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data: unknown = err.response?.data;
    if (data && typeof data === "object") {
      const { message, errors } = data as { message?: unknown; errors?: unknown };
      if (Array.isArray(errors) && errors.length > 0) return errors.join(" ");
      if (typeof message === "string" && message) return message;
    }
    if (typeof data === "string" && data) return data;
  }
  return fallback;
}

export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/User/login", data);
  return response.data;
}

export async function signupApi(data: SignUpRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/api/User/signup", data);
  return response.data;
}

export async function checkLoginApi(token: string | null): Promise<boolean> {
  if (!token) return false;

  try {
    const response = await api.post(
      "/api/account/validate",
      { accessToken: token },
      { headers: { "Content-Type": "application/json" } }
    );

    return response.status === 200;
  } catch {
    return false;
  }
}

export async function refreshTokenApi(): Promise<string | null> {
  const response = await api.get<AuthResponse>("/api/account/refresh-token");

  return response.data.isAuthSuccessful
    ? response.data.token ?? null
    : null;
}

export async function logOutApi(): Promise<boolean> {
  const response = await api.post("/api/User/logout");
  return response.status === 200;
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    await api.post("/api/User/change-password", { currentPassword, newPassword });
  } catch (err) {
    throw new Error(accountErrorMessage(err, "Password change failed"));
  }
}

// Returns a fresh access token carrying the new username claim.
export async function updateProfileApi(username: string): Promise<string | null> {
  try {
    const response = await api.put<AuthResponse>("/api/User/profile", { username });
    return response.data.token ?? null;
  } catch (err) {
    throw new Error(accountErrorMessage(err, "Saving account settings failed"));
  }
}
