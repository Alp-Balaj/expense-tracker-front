import apiClient from "./apiClient";

export const getExpenses = () => apiClient.get("/Expense");

export const addExpense = (expenseData) => apiClient.post("/Expense", expenseData);

export const updateExpense = (id, expenseData) => apiClient.put(`/Expense/${id}`, expenseData);

export const deleteExpense = (id) => apiClient.delete(`/Expense/${id}`);
