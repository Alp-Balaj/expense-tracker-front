import { useAuth } from "../Authorization/AuthContext";
import {
  loginApi,
  signupApi,
  checkLoginApi,
  refreshTokenApi,
  logOutApi
} from "../Services/loginServices";
import type { LoginRequest, SignUpRequest, AuthResponse } from "../Models/UserAuth";

export function useAuthenticationApi() {
  const { accessToken, setToken } = useAuth();

  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await loginApi(data);

      const token = response.token ?? null;
      setToken(token);

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      throw new Error(message);
    }
  };

  const signup = async (data: SignUpRequest): Promise<AuthResponse> => {
    try {
      const response = await signupApi(data);

      const token = response.token ?? null;
      setToken(token);

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registering user failed";
      throw new Error(message);
    }
  };

  const checkLogin = async (): Promise<boolean> => {
    if (await checkLoginApi(accessToken)) return true;

    const newToken = await refreshTokenApi();
    if (!newToken) return false;

    setToken(newToken);
    return true;
  };

  const logout = async (): Promise<void> => {
    await logOutApi();
    setToken(null);
  };

  return { login, signup, checkLogin, logout };
}
