import React, { useEffect }  from 'react';
import {
  Modal, Box, IconButton, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styled from 'styled-components';
import { useForm, FormProvider } from 'react-hook-form';

const defaultStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  color: 'white',
  bgcolor: '#1e2a47',
  border: '2px solid #c6c6c6',
  borderRadius: '15px',
  boxShadow: 24,
  p: 4,
};

const ModalTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: center;
`;

const GeneralEditor = ({ open, handleClose, children, sx, title, editing, data, onSubmit }) => {
  const methods = useForm({
    defaultValues: {}
  });

  useEffect(() => {
    if (editing && data) {
      methods.reset(data);
    } else {
      methods.reset({});
    }
  }, [editing, data]);

  const { handleSubmit } = methods;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      disableEscapeKeyDown
      aria-labelledby="general-modal-title"
      aria-describedby="general-modal-description"
    >
      <Box sx={{ ...defaultStyle, ...sx }}>
        <ModalTitle>
          <h2 id="general-modal-title">{editing ? 'Edit' : 'Add'} {title}</h2>
          <IconButton style={{ color: 'white' }} aria-label="close" size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </ModalTitle>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
          {children && React.Children.map(children, child =>
            React.cloneElement(child, { data })
          )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                sx={{
                  padding: '10px 20px',
                  backgroundColor: '#1E2A47',
                  color: '#fff',
                  borderRadius: '6px',
                  '&:hover': { 
                    backgroundColor: '#121f41',
                    boxShadow: 'inset 0 0 15px 1px #fffd0099'
                  },
                }}
                variant="contained"
                type="submit"
              >
                Submit
              </Button>
            </Box>
          </form>
        </FormProvider>
      </Box>
    </Modal>
  );
};

export default GeneralEditor;
