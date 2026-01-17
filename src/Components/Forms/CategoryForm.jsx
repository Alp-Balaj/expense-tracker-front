import { useState } from "react";

function CategoryForm({ row = {}, onSubmit, onCancel }) {
  console.log("data passed through", row);

  const [data, setData] = useState({
    id: row?.id || null,
    name: row?.name || "",
    description: row?.description || "",
    categoryTypeId: row?.categoryTypeId || 0,
    color: row?.color || ""
  });
  
  const handleSubmit = (e) => {
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

      <button type="submit">Save</button>      
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default CategoryForm;