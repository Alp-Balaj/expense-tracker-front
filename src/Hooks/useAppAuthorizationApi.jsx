import { useAuth } from "../Authorization/AuthContext";
import { getDataApi, postDataApi, putDataApi, deleteDataApi, getAllDataApi } from '../Services/apiServices';

export function useAuthorizationApi() {
    const { accessToken } = useAuth();

    const getData = async (url) => {
        const response = await getDataApi(url, accessToken);
        return response;
    };

    const postData = async (url, data ) => {
        const response = await postDataApi(url, data, accessToken);
        return response;
    };

    const putData = async (url, data ) => {
        const response = await putDataApi(url + `/${data.id}`, data, accessToken);
        return response;
    };

    const deleteData = async (url, data ) => {
        const response = await deleteDataApi(url + `/${data.id}`, accessToken);
        return response;
    };

    const getAllData = async (url) => {
        const response = await getAllDataApi(url, accessToken);
        return response;
    };

    return { getData, postData, putData, deleteData, getAllData };
}
