import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme
} from '@mui/material';

function ConfirmDialog({ open, title, content, onClose, onConfirm }) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{
        sx: {
          backgroundColor: '#1E2A47',
          border: '1px solid #2D3748',
          borderRadius: 2,
        },
      }}
    >
      {title && (
        <DialogTitle
          id="confirm-dialog-title"
          sx={{ color: '#fff', fontWeight: 'bold', fontSize: '20px' }}
        >
          {title}
        </DialogTitle>
      )}

      {content && (
        <DialogContent dividers sx={{ borderColor: '#2D3748' }}>
          <Typography
            id="confirm-dialog-description"
            sx={{ color: '#ccc', fontSize: '16px' }}
          >
            {content}
          </Typography>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            padding: '8px 16px',
            backgroundColor: '#121A3D',
            color: '#fff',
            border: '1px solid #2D3748',
            borderRadius: '6px',
            '&:hover': { backgroundColor: '#131b30' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          sx={{
            padding: '8px 16px',
            backgroundColor: '#1E2A47',
            color: '#fff',
            borderRadius: '6px',
            border: '1px solid red',
            '&:hover': { 
              backgroundColor: '#273559',
              boxShadow: '0px 0px 9px 1px inset #ff00004d'
             },
          }}
          variant="contained"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ConfirmDialog;
