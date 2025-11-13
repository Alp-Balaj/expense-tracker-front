import { Modal, Box, Typography, Button } from "@mui/material";
import { IncomeForm } from "../../Forms/IncomeForm";
import { useState } from "react";

export function IncomeModal({ open, handleClose, onSave, initialData }) {
  const handleSubmit = (e) => {
    e.preventDefault();       
    onSave(formData);         
    handleClose();  
  };

  const [formData, setFormData] = useState(
    initialData || {
      source: "",
      amount: 0,
      date: new Date().toISOString(),
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
          {initialData ? "Edit Income" : "Add New Income"}
        </Typography>

        <IncomeForm
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
