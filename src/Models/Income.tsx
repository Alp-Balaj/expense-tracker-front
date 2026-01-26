import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/Components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";

export type Income = {
  id: string;
  title: string;
  amount: number;
  date: string;
  description?: string | null;
  accountName: string;
  accountId: string;
  categoryId: string;
};

export type IncomeFormData = {
  title: string;
  amount: number;
  date: Date;
  description: string;
  accountId: string;
  categoryId: string;
};

export type IncomeWithDetails = Income & {
  accountName: string;
  categoryName: string;
  categoryColor: string;
};


export function incomeColumns(opts?: {
  onEdit?: (row: Income) => void;
  onDelete?: (row: Income) => void;
}): ColumnDef<Income>[] {
  return [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "accountName", header: "Account" },
    { accessorKey: "categoryName", header: "Source" },
    {
      id: "actions",
      cell: ({ row }) => {
        const income = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => opts?.onEdit?.(income)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => opts?.onDelete?.(income)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
