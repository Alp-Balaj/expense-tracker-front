import { useAuth } from '../Authorization/AuthContext';
import { loginApi, checkLoginApi, refreshTokenApi, logOutApi } from '../services/loginServices';

export function useAuthApi() {
    const { accessToken, setAccessToken } = useAuth();

    const login = async (data) => {
        try {
            const response = await loginApi(data);
            const token = response.token;
            setAccessToken(token);
            return response;
        } catch (error) {
            throw new Error('Login failed');
        }
    };

    const checkLogin = async () => {
        if (await checkLoginApi(accessToken)) return true;
      
        const response = await refreshTokenApi();
      
        if (response !== "Refresh token not found" && response !== "Invalid or expired refresh token") {
          setAccessToken(response);
          return true;
        } else {
          return false;
        }
      };
      

    const logout = async () => {
        await logOutApi();
        setAccessToken(null);
    };

    return { login, checkLogin, logout };
}
