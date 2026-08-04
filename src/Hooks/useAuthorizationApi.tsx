import { useCallback, useMemo } from "react";
import { postDataApi, putDataApi, deleteDataApi, getAllDataApi } from "../Services/apiServices";

type EntityWithId = { id: string | null };

export function useAuthorizationApi() {
  const getAllData = useCallback(<T = unknown>(url: string) => getAllDataApi(url) as Promise<T>, []);

  const postData = useCallback(<T = unknown, B = unknown>(url: string, data: B) => postDataApi(url, data) as Promise<T>, []);
  const putData = useCallback(<T = unknown, B extends EntityWithId = EntityWithId>(url: string, data: B) => putDataApi(`${url}/${data.id}`, data) as Promise<T>, []);
  const deleteData = useCallback(<T = unknown>(url: string, data: EntityWithId) => deleteDataApi(`${url}/${data.id}`) as Promise<T>, []);

  const putDataNoId = useCallback(<T = unknown, B = unknown>(url: string, data: B) => putDataApi(url, data) as Promise<T>, []);

  // Cycle U W2: a DELETE whose url is already complete, and whose response body
  // matters. Deleting a pot expense is not "remove entity by id" — the id sits
  // inside a pot's route, and the answer is the whole recomputed ledger.
  const deleteDataNoId = useCallback(<T = unknown>(url: string) => deleteDataApi(url) as Promise<T>, []);


  return useMemo(
    () => ({ getAllData, postData, putData, deleteData, putDataNoId, deleteDataNoId }),
    [getAllData, postData, putData, deleteData, putDataNoId, deleteDataNoId]
  );
}
