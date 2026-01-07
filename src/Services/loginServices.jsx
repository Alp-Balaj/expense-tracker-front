import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true
});

export async function loginApi(data) {
    try {
        const response = await api.post('/api/User/login', data);
        return response.data;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
}

export async function signupApi(data) {
    try {
        const response = await api.post('/api/User/signup', data);
        return response.data;
    } catch (error) {
        console.error("Registering user failed:", error);
        throw error;
    }
}

export async function checkLoginApi(token) {
    try {
        if(!token) return false;
        const response = await api.post('/api/account/validate',
            { accessToken: token },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        return response.status === 200;
    } catch (error) {
        return false;
    }
}

export async function refreshTokenApi(){
    const response = await api.get('/api/account/refresh-token');
    
    if(response.data.isAuthSuccessful)
        return response.data.token;
    return response.data.message;
}

export async function logOutApi(){
    const response = await api.get('/api/account/logout');
    return response.status === 200;
}