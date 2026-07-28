import { Filter, X } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { Separator } from "@/Components/ui/separator";
import {
  EMPTY_LIST_FILTERS,
  activeFilterCount,
  toggleId,
  type AmountRange,
  type ListFilters,
} from "@/lib/listFilters";

export type FilterOption = { value: string; label: string };

interface ListFilterMenuProps {
  value: ListFilters;
  onChange: (next: ListFilters) => void;
  categories: FilterOption[];
  accounts: FilterOption[];
  amountLabel?: string;
}

/**
 * The category / account / amount filter popover — the control the dead Filter
 * button used to only promise before Fix-18 removed it.
 *
 * Controlled by the page rather than by the table, so the same selection drives
 * the rows, the summary cards and the charts.
 */
export function ListFilterMenu({
  value,
  onChange,
  categories,
  accounts,
  amountLabel = "Amount",
}: ListFilterMenuProps) {
  const count = activeFilterCount(value);

  const setBound = (index: 0 | 1, raw: string) => {
    const parsed = raw.trim() === "" ? undefined : Number(raw);
    const bound = Number.isFinite(parsed) ? parsed : undefined;

    const amount: AmountRange = [value.amount[0], value.amount[1]];
    amount[index] = bound;
    onChange({ ...value, amount });
  };

  const facets: { key: "categoryIds" | "accountIds"; label: string; options: FilterOption[] }[] = [
    { key: "categoryIds", label: "Category", options: categories },
    { key: "accountIds", label: "Account", options: accounts },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 border-border">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {count > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 space-y-4" align="end">
        {facets.map((facet) => {
          const selected = value[facet.key];

          return (
            <div key={facet.key} className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {facet.label}
              </Label>

              {facet.options.length === 0 ? (
                <p className="text-sm text-muted-foreground">None available</p>
              ) : (
                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                  {facet.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${facet.key}-${option.value}`}
                        checked={selected.includes(option.value)}
                        onCheckedChange={() =>
                          onChange({
                            ...value,
                            [facet.key]: toggleId(selected, option.value),
                          })
                        }
                      />
                      <Label
                        htmlFor={`${facet.key}-${option.value}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {amountLabel}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Min"
              aria-label={`Minimum ${amountLabel.toLowerCase()}`}
              value={value.amount[0] ?? ""}
              onChange={(e) => setBound(0, e.target.value)}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Max"
              aria-label={`Maximum ${amountLabel.toLowerCase()}`}
              value={value.amount[1] ?? ""}
              onChange={(e) => setBound(1, e.target.value)}
            />
          </div>
        </div>

        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            onClick={() => onChange(EMPTY_LIST_FILTERS)}
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
