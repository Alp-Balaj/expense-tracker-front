// Services/apiServices.js
import { api } from "./api.ts";

export const getDataApi = async (url) => (await api.get(url)).data;
export const getAllDataApi = async (url) => (await api.get(url)).data;
export const postDataApi = async (url, data) => (await api.post(url, data)).data;
export const putDataApi = async (url, data) => (await api.put(url, data)).data;
export const deleteDataApi = async (url) => (await api.delete(url)).data;