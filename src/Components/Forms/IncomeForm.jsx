import { TextField, Button, Box } from "@mui/material";

export function IncomeForm({ formData, setFormData, handleSubmit }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "amount" ? Number(value) : value,
    });
    console.log(formData);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <TextField
        name="source"
        label="Source"
        value={formData.source}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        name="amount"
        label="Amount"
        type="number"
        value={formData.amount}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        name="date"
        label="Date"
        type="datetime-local"
        value={formData.date.slice(0, 16)}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        name="description"
        label="Description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={3}
        fullWidth
      />

      <TextField
        name="paymentMethod"
        label="Payment Method"
        value={formData.paymentMethod}
        onChange={handleChange}
        fullWidth
      />

      <Button type="submit" variant="contained" color="primary" fullWidth>
        Save Income
      </Button>
    </Box>
  );
}
