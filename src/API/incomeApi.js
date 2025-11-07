import apiClient from "./apiClient";

export const getIncomes = () => apiClient.get("/income");

export const addIncome = (incomeData) => apiClient.post("/income", incomeData);

export const updateIncome = (id, incomeData) => apiClient.put(`/income/${id}`, incomeData);

export const deleteIncome = (id) => apiClient.delete(`/income/${id}`);