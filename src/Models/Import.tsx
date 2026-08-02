/** Wire shapes for Suggestion-6's CSV import. Mirrors ImportDTO.cs. */

export interface ImportCategoryRule {
  contains: string;
  categoryId: string;
}

/**
 * How to read one bank's export. Called a "profile" in the vault note; kept
 * client-side (see `lib/importProfiles`) because Stream G carries no migration.
 */
export interface ImportMapping {
  accountId: string;
  dateColumn: number;
  amountColumn: number;
  descriptionColumn: number;
  counterpartyColumn: number | null;
  hasHeaderRow: boolean;
  skipRows: number;
  delimiter: string | null;
  culture: string;
  dateFormat: string | null;
  negativeIsExpense: boolean;
  defaultExpenseCategoryId: string;
  defaultIncomeCategoryId: string;
  rules: ImportCategoryRule[];
}

export interface ImportPreviewRow {
  rowNumber: number;
  date: string | null;
  amount: number;
  isExpense: boolean;
  title: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  categoryFromRule: boolean;
  isDuplicate: boolean;
  problem: string | null;
  canImport: boolean;
  raw: string[];
}

export interface ImportSuggestedMapping {
  dateColumn: number | null;
  amountColumn: number | null;
  descriptionColumn: number | null;
  counterpartyColumn: number | null;
}

export interface ImportPreview {
  columns: string[];
  delimiter: string;
  suggested: ImportSuggestedMapping;
  rows: ImportPreviewRow[];
  totalRows: number;
  readyCount: number;
  duplicateCount: number;
  problemCount: number;
  truncated: boolean;
}

export interface ImportProblem {
  rowNumber: number;
  reason: string;
  raw: string[];
}

export interface ImportResult {
  imported: number;
  duplicatesSkipped: number;
  failed: number;
  expenseTotal: number;
  incomeTotal: number;
  problems: ImportProblem[];
}

/** A saved mapping, plus the name the user gave it. */
export interface ImportProfile {
  id: string;
  name: string;
  mapping: ImportMapping;
  updatedAt: string;
}

export const EMPTY_MAPPING: ImportMapping = {
  accountId: "",
  dateColumn: -1,
  amountColumn: -1,
  descriptionColumn: -1,
  counterpartyColumn: null,
  hasHeaderRow: true,
  skipRows: 0,
  delimiter: null,
  culture: "en-US",
  dateFormat: null,
  negativeIsExpense: true,
  defaultExpenseCategoryId: "",
  defaultIncomeCategoryId: "",
  rules: [],
};

/** The three columns and two defaults the server insists on before it will commit. */
export function isMappingComplete(mapping: ImportMapping): boolean {
  return (
    mapping.accountId !== "" &&
    mapping.dateColumn >= 0 &&
    mapping.amountColumn >= 0 &&
    mapping.descriptionColumn >= 0 &&
    mapping.defaultExpenseCategoryId !== "" &&
    mapping.defaultIncomeCategoryId !== ""
  );
}
