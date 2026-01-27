import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Filter, Plus, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type DataTableToolbarProps = {
  searchPlaceholder?: string;
  addLabel?: string;
  onAdd?: () => void;
  rightSlot?: React.ReactNode; // extra buttons/filters from parent
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // global search controls
  enableGlobalSearch?: boolean;
  searchPlaceholder?: string;
  globalSearchKeys?: (keyof TData)[]; // optional: restrict search to these fields

  // toolbar controls
  toolbar?: DataTableToolbarProps;
}

const makeGlobalIncludes = <TData,>(
  keys?: (keyof TData)[]
): FilterFn<TData> => {
  return (row, _columnId, filterValue) => {
    const q = String(filterValue ?? "").trim().toLowerCase();
    if (!q) return true;

    const values = keys?.length
      ? keys.map((k) => row.original?.[k])
      : Object.values(row.original as Record<string, unknown>);

    return values.some((v) => String(v ?? "").toLowerCase().includes(q));
  };
};

export function DataTable<TData, TValue>({ columns, data, enableGlobalSearch = true, searchPlaceholder = "Search...", globalSearchKeys, toolbar }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [accountFilter, setAccountFilter] = React.useState<string>("all");


  const table = useReactTable({
    data,
    columns,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,

    ...(enableGlobalSearch
      ? {
          globalFilterFn: makeGlobalIncludes<TData>(globalSearchKeys),
          onGlobalFilterChange: setGlobalFilter,
        }
      : {}),

    state: {
      sorting,
      columnFilters,
      ...(enableGlobalSearch ? { globalFilter } : {}),
    },
  });

  return (
    <div>
      {(enableGlobalSearch || toolbar) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {enableGlobalSearch && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-primary/5 border-primary/20 focus:border-primary"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </div>
          )}

          {toolbar && (
            <div className="flex gap-2">
              {toolbar.onAdd && (
                <Button onClick={toolbar.onAdd} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{toolbar.addLabel ?? "Add"}</span>
                </Button>
              )}

              <Button variant="outline" size="icon" className="shrink-0 bg-transparent border-border">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>

              {toolbar.rightSlot}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden mt-5">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-end space-x-2 py-4 pr-5">
          <Button size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}