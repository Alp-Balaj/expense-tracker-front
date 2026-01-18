import React, { useMemo, useState } from "react";
import type { Category, CategoryFormProps } from "../../Models/Category";
import { Button } from "../ui/button";

export default function CategoryForm({
  row,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const initial: Category = useMemo(
    () => ({
      id: row?.id ?? null,
      name: row?.name ?? "",
      description: row?.description ?? "",
      categoryTypeId: row?.categoryTypeId ?? "",
      color: row?.color ?? "",
    }),
    [row]
  );
  
  const [data, setData] = useState<Category>(initial);

  React.useEffect(() => {
    setData(initial);
  }, [initial]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        placeholder="Name"
      />
      
      <input
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Description"
      />

      <input
        value={data.categoryTypeId}
        onChange={(e) => setData({ ...data, categoryTypeId: e.target.value })}
        placeholder="Category Type ID"
      />

      <input
        value={data.color}
        onChange={(e) => setData({ ...data, color: e.target.value })}
        placeholder="Color"
      />

      <Button type="submit">Save</Button>      
      <Button type="button" onClick={onCancel}>Cancel</Button>
    </form>
  );
}