// Transaction Report Request - matches backend DTO
export interface TransactionReportRequest {
  from: string; // ISO date string
  to: string; // ISO date string
  categoryIds?: string[];
  accountIds?: string[];
  includeExpenses: boolean;
  includeIncomes: boolean;
}

// Transaction Report Row - inferred structure for transaction details
export interface TransactionReportRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
}

// Transaction Report Result - matches backend DTO
export interface TransactionReportResult {
  rows: TransactionReportRow[];
  total: number;
}

// Report types for tabs
export type ReportType = "transactions" | "summary" | "budget" | "trends";

export const reportTypeLabels: Record<ReportType, string> = {
  transactions: "Transaction Report",
  summary: "Summary Report",
  budget: "Budget Report",
  trends: "Trends Report",
};