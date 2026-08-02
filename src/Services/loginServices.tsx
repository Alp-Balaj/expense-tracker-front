import axios from "axios";
import { api } from "./api";
import type { LoginRequest, SignUpRequest, AuthResponse, MeResponse } from "../Models/UserAuth";

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

// reset-password failures come as { message, errors: { password: [...] } } —
// the same nested shape signup uses — so the flat accountErrorMessage helper
// would miss the password-policy details.
function resetErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data: unknown = err.response?.data;
    if (data && typeof data === "object") {
      const { message, errors } = data as {
        message?: unknown;
        errors?: { password?: unknown };
      };
      const password = errors?.password;
      if (Array.isArray(password) && password.length > 0) return password.join(" ");
      if (typeof message === "string" && message) return message;
    }
  }
  return fallback;
}

// Always answers 200 whether or not the email exists (anti-enumeration), so
// there is nothing useful to return.
export async function forgotPasswordApi(email: string): Promise<void> {
  await api.post("/api/User/forgot-password", { email });
}

export async function resetPasswordApi(
  email: string,
  token: string,
  newPassword: string
): Promise<void> {
  try {
    await api.post("/api/User/reset-password", { email, token, newPassword });
  } catch (err) {
    throw new Error(resetErrorMessage(err, "Resetting the password failed"));
  }
}

export async function confirmEmailApi(email: string, token: string): Promise<void> {
  try {
    await api.post("/api/User/confirm-email", { email, token });
  } catch (err) {
    throw new Error(
      resetErrorMessage(err, "This confirmation link is invalid or has expired.")
    );
  }
}

export async function sendConfirmationEmailApi(): Promise<void> {
  await api.post("/api/User/send-confirmation-email");
}

// The signed-in user's account info — the only place emailConfirmed surfaces
// (it is not a JWT claim).
export async function getMeApi(): Promise<MeResponse> {
  const response = await api.get<MeResponse>("/api/User/me");
  return response.data;
}
