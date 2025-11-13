import { Modal, Box, Typography, Button } from "@mui/material";
import { ExpenseForm } from "../../Forms/ExpenseForm";
import { useState } from "react";

export function ExpenseModal({ open, handleClose, onSave, initialData }) {
  const handleSubmit = (e) => {
    e.preventDefault();       
    onSave(formData);         
    handleClose();  
  };


  const [formData, setFormData] = useState(
    initialData || {
      title: "",
      amount: 0,
      date: new Date().toISOString(),
      category: "",
      description: "",
      paymentMethod: "",
    }
  );

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6" textAlign="center" mb={2}>
          {initialData ? "Edit Expense" : "Add New Expense"}
        </Typography>

        <ExpenseForm
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
        />

        <Button onClick={handleClose} fullWidth sx={{ mt: 2 }}>
          Cancel
        </Button>
      </Box>
    </Modal>
  );
}
