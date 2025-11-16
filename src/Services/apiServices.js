import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true
});

export async function getDataApi(url, token) {
  console.log(url);
  
  const response = await api.get(url,{
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function postDataApi(url, data, token) {
  const response = await api.post(url, data, {
    headers:{
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function putDataApi(url, data, token) {
  const response = await api.put(url, data, {
    headers:{
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function deleteDataApi(url, id, token) {
  const fullUrl = id !== undefined ? `${url}/${id}` : url;
  const response = await api.delete(fullUrl, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export async function getAllDataApi(url, token) {
  const fullUrl = `${url}`;
  const response = await api.get(fullUrl, {
    headers:{
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}