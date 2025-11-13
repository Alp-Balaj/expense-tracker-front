import { useState, useEffect } from "react";
import { getIncomes, addIncome } from "../API/incomeApi";

export const useIncomes = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const response = await getIncomes();
      setIncomes(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const createIncome = async (expenseData) => {
    try {
      const response = await addIncome(expenseData);
      setIncomes((prev) => [...prev, response.data]);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  return { incomes, loading, error, fetchIncomes, createIncome };
};