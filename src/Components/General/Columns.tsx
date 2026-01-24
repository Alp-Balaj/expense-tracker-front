import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/Components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu"

/* ----------------------------------------
   Basic text column
----------------------------------------- */
export function textColumn<T>(
  accessorKey: keyof T & string,
  header: string
): ColumnDef<T> {
  return {
    accessorKey,
    header,
  }
}

/* ----------------------------------------
   Sortable column (text / number / date)
----------------------------------------- */
export function sortableColumn<T>(
  accessorKey: keyof T & string,
  header: string
): ColumnDef<T> {
  return {
    accessorKey,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        {header}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  }
}

/* ----------------------------------------
   Currency column
----------------------------------------- */
export function currencyColumn<T>(
  accessorKey: keyof T & string,
  header: string,
  options: {
    locale?: string
    currency: string
  }
): ColumnDef<T> {
  const { locale = "en-US", currency } = options

  return {
    accessorKey,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        {header}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue(accessorKey)
      const value = typeof raw === "number" ? raw : Number(raw)

      const formatted = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(value)

      return <div className="text-left font-medium">{formatted}</div>
    },
  }
}

/* ----------------------------------------
   Actions column
----------------------------------------- */
export type RowAction<T> = {
  label: string
  onClick: (row: T) => void
}

export function actionsColumn<T>(
  actions: RowAction<T>[],
  label = "Actions"
): ColumnDef<T> {
  return {
    id: "actions",
    cell: ({ row }) => {
      const data = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{label}</DropdownMenuLabel>

            {actions.map((action, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={() => action.onClick(data)}
              >
                {action.label}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}
