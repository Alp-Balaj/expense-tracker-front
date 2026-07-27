import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Backend controller is SavingGoalController -> route "api/SavingGoal" (no "s")
export const SAVING_GOAL_API = "api/SavingGoal";

// Likewise BudgetController -> "api/Budget"
export const BUDGET_API = "api/Budget";