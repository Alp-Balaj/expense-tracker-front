"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import type { Category } from "@/Models/Category";
import { CategoryType } from "@/Enums/enums";

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSave: (category: Category) => void;
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

  const handleSave = () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "New Category"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details below."
              : "Create a new category for tracking your finances."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Groceries"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Weekly grocery shopping expenses"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={String(categoryType)} onValueChange={(v) => setCategoryType(Number(v) as CategoryType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(CategoryType.Expense)}>Expense</SelectItem>
                <SelectItem value={String(CategoryType.Income)}>Income</SelectItem>
                <SelectItem value={String(CategoryType.Savings)}>Savings</SelectItem>
                <SelectItem value={String(CategoryType.FutureExpense)}>
                  Future Expense
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEditing ? "Save Changes" : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
