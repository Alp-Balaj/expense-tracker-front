import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../Authorization/AuthContext";
import {
  loginApi,
  signupApi,
  logOutApi
} from "../Services/loginServices";
import type { LoginRequest, SignUpRequest, AuthResponse } from "../Models/UserAuth";

// The backend answers failed auth with a plain-string body ("Invalid
// credentials") or an object carrying a message; axios's own err.message
// ("Request failed with status code 401") is useless to the user.
function serverErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data: unknown = err.response?.data;
    if (typeof data === "string" && data) return data;
    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message) return message;
    }
  }
  return fallback;
}

export function useAuthenticationApi() {
  const { setToken } = useAuth();
  const queryClient = useQueryClient();

  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await loginApi(data);

      const token = response.token ?? null;
      setToken(token);

      // Query keys are user-agnostic (["accounts"], ["categories"], …), so any
      // cache built under a previous identity must go — including the case
      // where this login happens without an intervening logout.
      queryClient.clear();

      return response;
    } catch (err) {
      throw new Error(serverErrorMessage(err, "Invalid email or password"));
    }
  };

  const signup = async (data: SignUpRequest): Promise<AuthResponse> => {
    try {
      const response = await signupApi(data);

      const token = response.token ?? null;
      setToken(token);
      queryClient.clear();

      return response;
    } catch (err) {
      throw new Error(serverErrorMessage(err, "Registering user failed"));
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Best-effort server-side revocation; the local session is cleared
      // regardless so an unreachable backend can't strand the user.
      await logOutApi();
    } catch (err) {
      console.error(err);
    } finally {
      setToken(null);
      queryClient.clear();
    }
  };

  return { login, signup, logout };
}
