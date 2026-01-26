import { useCallback, useMemo } from "react";
import { getDataApi, postDataApi, putDataApi, deleteDataApi, getAllDataApi } from "../Services/apiServices";

type EntityWithId = { id: string | null };

export function useAuthorizationApi() {
  const getData = useCallback(<T = unknown>(url: string) => getDataApi(url) as Promise<T>, []);
  const getAllData = useCallback(<T = unknown>(url: string) => getAllDataApi(url) as Promise<T>, []);

  const postData = useCallback(<T = unknown, B = unknown>(url: string, data: B) => postDataApi(url, data) as Promise<T>, []);
  const putData = useCallback(<T = unknown, B extends EntityWithId = EntityWithId>(url: string, data: B) => putDataApi(`${url}/${data.id}`, data) as Promise<T>, []);
  const deleteData = useCallback(<T = unknown>(url: string, data: EntityWithId) => deleteDataApi(`${url}/${data.id}`) as Promise<T>, []);

  const putDataNoId = useCallback(<T = unknown, B = unknown>(url: string, data: B) => putDataApi(url, data) as Promise<T>, []);


  return useMemo(
    () => ({ getData, getAllData, postData, putData, deleteData, putDataNoId }),
    [getData, getAllData, postData, putData, deleteData, putDataNoId]
  );
}
