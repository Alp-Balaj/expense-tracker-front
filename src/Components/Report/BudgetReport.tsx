import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, PieChart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import { Spinner } from "@/Components/ui/spinner";
import { MonthSelector } from "@/Components/Budget/MonthSelector";
import { BudgetProgressBar } from "@/Components/Budget/BudgetProgressBar";
import { useBudgetStatusQuery } from "@/Hooks/queries/useBudgets";
import { useCurrency } from "@/Hooks/useCurrency";
import { budgetTone, budgetToneClasses, currentMonth, formatMonth } from "@/lib/budget";

const TONE_LABEL = {
  under: "On track",
  warning: "Nearly there",
  over: "Over budget",
} as const;

/** Budget vs actual for one month — the real report behind the Budget tab. */
export function BudgetReport() {
  const [month, setMonth] = useState(currentMonth());
  const { data: statuses = [], isLoading, isError } = useBudgetStatusQuery(month);
  const { format, userCurrencyCode } = useCurrency();

  // Category budgets only: the overall budget covers the same spend, so
  // including it in the totals row would double-count.
  const categoryStatuses = useMemo(
    () => statuses.filter((s) => s.categoryId !== null),
    [statuses]
  );
  const overall = useMemo(
    () => statuses.find((s) => s.categoryId === null) ?? null,
    [statuses]
  );

  const totals = useMemo(
    () =>
      categoryStatuses.reduce(
        (acc, s) => ({
          limit: acc.limit + s.limit,
          spent: acc.spent + s.spent,
        }),
        { limit: 0, spent: 0 }
      ),
    [categoryStatuses]
  );

  const anyMissingRates = statuses.some((s) => s.hasMissingRates);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <PieChart className="h-4 w-4 text-primary" />
            Budget vs actual &middot; {formatMonth(month)}
          </CardTitle>
          <MonthSelector month={month} onChange={setMonth} />
        </div>
      </CardHeader>

      <CardContent>
        {isError ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Failed to load the budget report.
          </div>
        ) : isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : statuses.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <PieChart className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No budgets to report on
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a monthly limit and this report fills itself in.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/budgets">Go to budgets</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {anyMissingRates && (
              <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                Some spending is in a currency with no exchange rate set — those
                amounts are missing from the figures below.
              </p>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="w-40">Progress</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((status) => {
                    const tone = budgetTone(status.percentUsed);
                    const classes = budgetToneClasses[tone];
                    const isOverall = status.categoryId === null;

                    return (
                      <TableRow key={status.id} className={isOverall ? "bg-muted/40" : ""}>
                        <TableCell className="font-medium text-foreground">
                          <span className="flex items-center gap-2">
                            {!isOverall && (
                              <span
                                aria-hidden
                                className="h-2.5 w-2.5 shrink-0 rounded-full border border-border"
                                style={{
                                  backgroundColor: status.categoryColor ?? "transparent",
                                }}
                              />
                            )}
                            {status.categoryName}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {format(status.limit, userCurrencyCode)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {format(status.spent, userCurrencyCode)}
                        </TableCell>
                        <TableCell className={`text-right tabular-nums ${status.remaining < 0 ? classes.text : ""}`}>
                          {format(status.remaining, userCurrencyCode)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BudgetProgressBar
                              percentUsed={status.percentUsed}
                              height="sm"
                            />
                            <span className={`w-10 shrink-0 text-right text-xs ${classes.text}`}>
                              {Math.round(status.percentUsed)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={`${classes.badge} text-xs`}>
                            {TONE_LABEL[tone]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {categoryStatuses.length > 0 && (
                    <TableRow className="border-t-2 font-semibold">
                      <TableCell className="text-foreground">
                        Total of category budgets
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format(totals.limit, userCurrencyCode)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format(totals.spent, userCurrencyCode)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {format(totals.limit - totals.spent, userCurrencyCode)}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {overall && (
              <p className="text-xs text-muted-foreground">
                The overall budget is listed separately and excluded from the
                total row — it covers the same spending as the category budgets.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
