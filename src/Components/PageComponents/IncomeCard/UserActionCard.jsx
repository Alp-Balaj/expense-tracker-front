import styled from "styled-components";
import { Button, Grid, Typography, Box } from "@mui/material";
import { useIncomes } from "../../../Hooks/useIncomes";
import { useState } from "react";
import { IncomeModal } from "./IncomeModal"

//#region styled divs
const ActionCard = styled.div`
  width: 100%;
  height: 100%;
  background-color: #E7E7E7;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const InnerContainer = styled.div`
  width: 95%;
  height: 90%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const PlaceHolderDiv = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: #6F8B6D;
`

const ButtonDiv = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: #6F8B6D;
`
const TotalIncomeDiv = styled.div`
  width: 100%;
  border-radius: 10px;
  background-color: #E7E7E7;
`

const H1 = styled.h1`
  padding: 0;
  padding-left: 5px;
  margin: 0;
  font-size: 20px;
`

//#endregion

function UserActionCard() {

  const { incomes, loading, error, createIncome } = useIncomes();

  const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <ActionCard>
      <InnerContainer>

        <Grid container spacing={1} sx={{height:'15%'}}>

          <Grid size={6}>
            <ButtonDiv>
              <Button 
              variant="contained" color="green" sx={{ width: '100%', height: '100%', color: 'white' }}
              onClick={handleOpen} >
                Add Income
              </Button>
            </ButtonDiv>
          </Grid>

          <Grid size={6} sx={{height: '100%'}}>
              <Grid container spacing={1} sx={{height:'100%', padding: '5px', backgroundColor: '#6f8b6d', borderRadius: '10px'}}>
                <TotalIncomeDiv>
                  <H1>
                    Total Income
                  </H1>
                  <H1>
                    ${totalIncome.toFixed(2)}
                  </H1>
                </TotalIncomeDiv>
              </Grid>
          </Grid>
          
        </Grid>

        <Grid container spacing={1} sx={{height:'80%'}}>
          <PlaceHolderDiv>
            {loading && <Typography sx={{
                      padding: '5px 10px',
            }}>Loading...</Typography>}
            {error && <Typography sx={{
                      padding: '5px 10px',
            }} color="error">Error loading incomes</Typography>}
            {!loading && !error && incomes.length === 0 && (
              <Typography sx={{
                      padding: '5px 10px',
            }}>No incomes added yet.</Typography>
            )}
            {!loading && !error && incomes.length > 0 && (
              <Box>
                {incomes.map((income) => (
                  <Box
                    key={income.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '5px 10px',
                      borderBottom: '1px solid #ccc',
                      color: 'white'
                    }}
                  >
                    <Typography>{income.source}</Typography>
                    <Typography>${income.amount.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </PlaceHolderDiv>
        </Grid>
        
      </InnerContainer>

      <IncomeModal
        open={open}
        handleClose={handleClose}
        onSave={createIncome}
      />


    </ActionCard>
  )
}

export default UserActionCard