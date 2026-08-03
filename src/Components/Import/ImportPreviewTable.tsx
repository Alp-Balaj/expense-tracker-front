import { AlertTriangle, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ImportPreviewRow } from "@/Models/Import";

interface ImportPreviewTableProps {
  rows: ImportPreviewRow[];
  currencyCode?: string;
}

/**
 * What the file would become, row by row.
 *
 * The whole reason Suggestion-6 is two-phase is that nobody can check an import
 * after the fact — a wrong column mapping produces a page of plausible numbers.
 * So problems and duplicates are marked here, before anything is written, and
 * marked differently: a duplicate is fine and expected (re-importing an
 * overlapping statement is normal), a problem is a row that will be left behind.
 */
export function ImportPreviewTable({ rows, currencyCode }: ImportPreviewTableProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nothing to preview yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Line</th>
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Description</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 text-right font-medium">Amount</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.rowNumber}
              className={cn(
                "border-b border-border/60",
                row.problem && "bg-destructive/5",
                row.isDuplicate && "text-muted-foreground"
              )}
            >
              <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                {row.rowNumber}
              </td>
              <td className="py-2 pr-3 whitespace-nowrap">{row.date ?? "—"}</td>
              <td className="max-w-[16rem] truncate py-2 pr-3" title={row.title}>
                {row.title || "—"}
              </td>
              <td className="py-2 pr-3">
                {row.problem ? (
                  "—"
                ) : (
                  <span className={cn(row.categoryFromRule && "text-primary")}>
                    {row.categoryName}
                  </span>
                )}
              </td>
              <td
                className={cn(
                  "py-2 pr-3 text-right font-mono whitespace-nowrap tabular-nums",
                  !row.problem && (row.isExpense ? "text-destructive" : "text-primary")
                )}
              >
                {row.problem
                  ? "—"
                  : `${row.isExpense ? "−" : "+"}${row.amount.toFixed(2)}${
                      currencyCode ? ` ${currencyCode}` : ""
                    }`}
              </td>
              <td className="py-2">
                {row.problem ? (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {row.problem}
                  </span>
                ) : row.isDuplicate ? (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                    Already imported
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Will import</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
