import { AxiosError } from "axios";
import { api } from "./api";
import type { LoginRequest, SignUpRequest, AuthResponse } from "../Models/UserAuth";

export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>("/api/User/login", data);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error as AxiosError);
    throw error;
  }
}

export async function signupApi(data: SignUpRequest): Promise<AuthResponse> {
  try {
    const response = await api.post<AuthResponse>("/api/User/signup", data);
    return response.data;
  } catch (error) {
    console.error("Registering user failed:", error as AxiosError);
    throw error;
  }
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
  const response = await api.get("/api/account/logout");
  return response.status === 200;
}
