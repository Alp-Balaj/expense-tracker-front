import { useAuth } from "../Authorization/AuthContext";
import { getDataApi, postDataApi, putDataApi, deleteDataApi, getAllDataApi } from '../Services/apiServices';

export function useAuthorizationApi() {
    const { accessToken } = useAuth();

    const getData = async (url: string) => {
        const response = await getDataApi(url, accessToken);
        return response;
    };

    const postData = async (url: string, data: any) => {
        const response = await postDataApi(url, data, accessToken);
        return response;
    };

    const putData = async (url: string, data: any) => {
        const response = await putDataApi(url + `/${data.id}`, data, accessToken);
        return response;
    };

    const deleteData = async (url: string, data: any) => {
        const response = await deleteDataApi(url + `/${data.id}`, accessToken);
        return response;
    };

    const getAllData = async (url: string) => {
        const response = await getAllDataApi(url, accessToken);
        return response;
    };

    return { getData, postData, putData, deleteData, getAllData };
}
