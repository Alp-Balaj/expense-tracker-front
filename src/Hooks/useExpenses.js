import { useState, useEffect } from "react";
import { getExpenses, addExpense } from "../API/expenseApi";

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await getExpenses();
      setExpenses(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData) => {
    try {
      const response = await addExpense(expenseData);
      setExpenses((prev) => [...prev, response.data]);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return { expenses, loading, error, fetchExpenses, createExpense };
};