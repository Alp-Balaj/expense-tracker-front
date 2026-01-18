import { api } from "./api";

export const getDataApi = async <T = unknown>(url: string): Promise<T> =>
  (await api.get<T>(url)).data;

export const getAllDataApi = async <T = unknown>(url: string): Promise<T> =>
  (await api.get<T>(url)).data;

export const postDataApi = async <T = unknown, B = unknown>(
  url: string,
  data: B
): Promise<T> =>
  (await api.post<T>(url, data)).data;

export const putDataApi = async <T = unknown, B = unknown>(
  url: string,
  data: B
): Promise<T> =>
  (await api.put<T>(url, data)).data;

export const deleteDataApi = async <T = unknown>(
  url: string
): Promise<T> =>
  (await api.delete<T>(url)).data;
