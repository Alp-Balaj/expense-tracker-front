import axios from "axios";

export const api = axios.create({
  // The "/" fallback is load-bearing, not tidiness. In production
  // VITE_API_BASE_URL is empty on purpose — the SPA is served by the API out of
  // its wwwroot, so every call is same-origin — and every path below is
  // relative ("api/Currency", no leading slash). With no baseURL, axios
  // resolves those against the *current page URL*, which is only harmless while
  // every route is one segment deep: from /savings, "api/Currency" resolves to
  // /api/Currency, but from /pots/<id> it resolves to /pots/api/Currency. That
  // path does not start with /api, so Program.cs's SPA fallback answers it with
  // index.html and axios hands back a string where the caller expected a list —
  // which surfaces far away as "x.filter is not a function", with the sidebar
  // blank and no clue where it came from.
  //
  // Anchoring the base at "/" makes every relative path absolute against the
  // origin and route depth stop mattering. Cycle U's /pots/:id is the app's
  // first nested route and the first thing ever to hit this.
  baseURL: import.meta.env.VITE_API_BASE_URL || "/",
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