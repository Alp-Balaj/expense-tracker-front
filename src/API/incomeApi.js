import apiClient from "./apiClient";

export const getIncomes = () => apiClient.get("/Income");

export const addIncome = (incomeData) => apiClient.post("/Income", incomeData);

export const updateIncome = (id, incomeData) => apiClient.put(`/Income/${id}`, incomeData);

export const deleteIncome = (id) => apiClient.delete(`/Income/${id}`);