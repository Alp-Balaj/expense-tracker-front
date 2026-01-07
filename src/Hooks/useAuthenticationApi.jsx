import { useAuth } from '../Authorization/AuthContext';
import { loginApi, signupApi, checkLoginApi, refreshTokenApi, logOutApi } from '../Services/loginServices';

export function useAuthenticationApi() {
    const { accessToken, setToken } = useAuth();

    const login = async (data) => {
        try {
            const response = await loginApi(data);
            console.log("Login response:", response);

            const token = response.token;
            console.log("Login token:", token);
            
            setToken(token);
            return response;
        } catch (error) {
            throw new Error('Login failed', error);
        }
    };

    const signup = async (data) => {
        try {
            const response = await signupApi(data);
            const token = response.token;
            setToken(token);
            return response;
        } catch (error) {
            throw new Error('Registering user failed');
        }
    };

    const checkLogin = async () => {
      if (await checkLoginApi(accessToken)) return true;
    
      const response = await refreshTokenApi();
    
      if (response !== "Refresh token not found" && response !== "Invalid or expired refresh token") {
        setToken(response);
        return true;
      } else {
        return false;
      } 
    };

    const logout = async () => {
        await logOutApi();
        setToken(null);
    };

    return { login, signup, checkLogin, logout };
}
