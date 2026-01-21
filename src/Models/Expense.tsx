import type { ColumnDef } from "@tanstack/react-table";

export type Expense = {
  id: string | null;
  title: string;
  amount: number;
  date: Date;
  description: string;
  accountId: string;
  categoryId: string;
};

export type ExpenseFormProps = {
  row?: Partial<Expense> | null;
  onSubmit: (data: Expense) => void;
  onCancel?: () => void;
};

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  // {
  //   accessorKey: "amount",
  //   header: "Amount",
  // },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(amount)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "accountId",
    header: "AccountId",
  },
  {
    accessorKey: "categoryId",
    header: "CategoryId",
  },
  
]