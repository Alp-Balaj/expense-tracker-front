import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Separator } from "@/Components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, AlertTriangle, Wallet } from "lucide-react";
import type { BudgetStatus } from "@/Models/Budget";
import { budgetTone, budgetToneClasses, overspend } from "@/lib/budget";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { useCurrency } from "@/Hooks/useCurrency";

interface BudgetCardProps {
  status: BudgetStatus;
  onEdit: (status: BudgetStatus) => void;
  onDelete: (status: BudgetStatus) => void;
}

export function BudgetCard({ status, onEdit, onDelete }: BudgetCardProps) {
  const { format, userCurrencyCode } = useCurrency();
  const tone = budgetTone(status.percentUsed);
  const classes = budgetToneClasses[tone];
  const over = overspend(status);
  const isOverall = status.categoryId === null;

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-lg ${
        tone === "under" ? "border-border bg-card" : `${classes.ring} bg-card`
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {isOverall ? (
              <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: status.categoryColor ?? "transparent" }}
              />
            )}
            <CardTitle className="truncate text-base text-foreground">
              {status.categoryName}
            </CardTitle>
            {tone === "over" && (
              <Badge className={`${classes.badge} shrink-0 text-xs`}>Over budget</Badge>
            )}
            {tone === "warning" && (
              <Badge className={`${classes.badge} shrink-0 text-xs`}>Nearly there</Badge>
            )}
          </div>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {status.note || (isOverall ? "Across every expense category" : "Monthly budget")}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 shrink-0 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(status)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit budget
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(status)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete budget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Spent this month</p>
            <p className={`text-2xl font-bold ${classes.text}`}>
              {format(status.spent, userCurrencyCode)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              of {format(status.limit, userCurrencyCode)}
            </p>
          </div>
          <p className={`text-lg font-semibold ${classes.text}`}>
            {Math.round(status.percentUsed)}%
          </p>
        </div>

        <BudgetProgressBar percentUsed={status.percentUsed} />

        <Separator />

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {over > 0 ? "Overspent by" : "Remaining"}
          </span>
          <span className={`font-medium ${over > 0 ? classes.text : "text-foreground"}`}>
            {format(over > 0 ? over : status.remaining, userCurrencyCode)}
          </span>
        </div>

        {status.hasMissingRates && (
          <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            Some spending is in a currency with no exchange rate set, so the total
            shown is lower than the real spend.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
