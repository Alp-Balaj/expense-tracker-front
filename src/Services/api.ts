import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Backend controller is SavingGoalController -> route "api/SavingGoal" (no "s")
export const SAVING_GOAL_API = "api/SavingGoal";

// Likewise BudgetController -> "api/Budget"
export const BUDGET_API = "api/Budget";

// PlannedTransactionController -> "api/PlannedTransaction". The due queue hangs
// off it rather than living at its own root, because an occurrence only ever
// makes sense as one due date of a template.
export const PLANNED_API = "api/PlannedTransaction";
export const PLANNED_OCCURRENCES_API = `${PLANNED_API}/occurrences`;