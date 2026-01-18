import { getDataApi, postDataApi, putDataApi, deleteDataApi, getAllDataApi } from '../Services/apiServices';


export function useAuthorizationApi() {
  const getData = (url: string) => getDataApi(url);
  const postData = (url: string, data: any) => postDataApi(url, data);
  const putData = (url: string, data: any) => putDataApi(`${url}/${data.id}`, data);
  const deleteData = (url: string, data: any) => deleteDataApi(`${url}/${data.id}`);
  const getAllData = (url: string) => getAllDataApi(url);

  return { getData, postData, putData, deleteData, getAllData };
}