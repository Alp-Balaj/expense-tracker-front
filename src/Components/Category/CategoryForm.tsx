"use client";

import { useState, useEffect } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import type { AddCategory } from "@/Models/Category";
import { CategoryType } from "@/Enums/enums";

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AddCategory | null;
  onSave: (category: AddCategory) => void;
  defaultType?: CategoryType;
}

const predefinedColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

const categoryTypes: { value: CategoryType; label: string }[] = [
  { value: CategoryType.Expense, label: "Expense" },
  { value: CategoryType.Income, label: "Income" },
  { value: CategoryType.Savings, label: "Savings" },
];

export function CategoryForm({
  open,
  onOpenChange,
  category,
  onSave,
  defaultType = CategoryType.Expense,
}: CategoryEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryType, setCategoryType] = useState<CategoryType>(defaultType);
  const [color, setColor] = useState(predefinedColors[0]);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
      setCategoryType(category.categoryType);
      setColor(category.color);
    } else {
      setName("");
      setDescription("");
      setCategoryType(defaultType);
      setColor(predefinedColors[0]);
    }
  }, [category, defaultType]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      id: category?.id || null,
      name,
      description,
      categoryType,
      color,
      totalAmount: category?.totalAmount,
    });
    onOpenChange(false);
  };

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Category" : "New Category"}
      description={
        isEditing
          ? "Update the category details below."
          : "Create a new category for tracking your finances."
      }
      submitLabel={isEditing ? "Save Changes" : "Create Category"}
      submitDisabled={!name.trim()}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[425px]"
    >
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Groceries"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Weekly grocery shopping expenses"
          rows={2}
        />
      </div>

      <ChipPicker
        label="Type"
        items={categoryTypes.map((t) => ({
          id: String(t.value),
          label: t.label,
        }))}
        value={String(categoryType)}
        onChange={(id) => {
          // Type is required: ignore the picker's tap-again deselect.
          if (id !== "") setCategoryType(Number(id) as CategoryType);
        }}
      />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Color</Label>
        <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
          {predefinedColors.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              className={`size-9 rounded-full border-2 transition-all ${
                color === c
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
    </FormShell>
  );
}
