import { Card, CardContent, CardFooter } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import type { Category } from "@/Models/Category";
import { CategoryType } from "@/Enums/enums";
import { Pencil, Trash2 } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

const typeColors: Record<CategoryType, { bg: string; border: string }> = {
  [CategoryType.Expense]: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  [CategoryType.Income]: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  [CategoryType.Savings]: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  [CategoryType.FutureExpense]: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

const typeTextColors: Record<CategoryType, string> = {
  [CategoryType.Expense]: "text-red-600 dark:text-red-400",
  [CategoryType.Income]: "text-emerald-600 dark:text-emerald-400",
  [CategoryType.Savings]: "text-blue-600 dark:text-blue-400",
  [CategoryType.FutureExpense]: "text-amber-600 dark:text-amber-400",
};

const typeLabels: Record<CategoryType, string> = {
  [CategoryType.Expense]: "Expense",
  [CategoryType.Income]: "Income",
  [CategoryType.Savings]: "Savings",
  [CategoryType.FutureExpense]: "Future Expense",
};

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const colorStyle = typeColors[category.categoryType];
  const textColor = typeTextColors[category.categoryType];

  return (
    <Card className={`${colorStyle.bg} ${colorStyle.border} border overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div
              className="w-3 h-3 rounded-full mb-2"
              style={{ backgroundColor: category.color }}
            />
            <h3 className="font-semibold text-foreground">{category.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {category.description}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Total Amount: {category.totalAmount}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className={`text-xs font-medium ${textColor}`}>
            {typeLabels[category.categoryType]}
          </span>
          {category.totalAmount !== undefined && (
            <span className="text-sm font-mono font-medium text-foreground">
              €{category.totalAmount? category.totalAmount.toLocaleString() : ""}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-0 border-t border-border/50">
        <div className="flex w-full">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 rounded-none h-9 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit?.(category)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <div className="w-px bg-border/50" />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 rounded-none h-9 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete?.(category)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
