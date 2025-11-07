import styled from "styled-components";
import { Button, Grid, Typography, Box } from "@mui/material";
import { useExpenses } from "../../Hooks/useExpenses";

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
  background-color: #8D4240;
`

const ButtonDiv = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: #8D4240;
`
const BalanceDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: #8D4240;
`

const InnerBalanceDiv = styled.div`
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


function UserActionCard() {

  const { expenses, loading, error } = useExpenses();

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ActionCard>
      <InnerContainer>

        <Grid container spacing={1} sx={{height:'15%'}}>
          <Grid size={6} sx={{height: '100%'}}>
              <Grid container spacing={1} sx={{height:'100%', padding: '5px', backgroundColor: '#8D4240', borderRadius: '10px'}}>
                <InnerBalanceDiv>
                  <H1>
                    Total Expenses
                  </H1>
                  <H1>
                    ${totalExpenses.toFixed(2)}
                  </H1>
                </InnerBalanceDiv>
              </Grid>
          </Grid>
          <Grid size={6}>
            <ButtonDiv>
              <Button variant="contained" color="primary" sx={{ width: '100%', height: '100%' }}>
                Add Expense
              </Button>
            </ButtonDiv>
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{height:'80%'}}>
          <PlaceHolderDiv>
            {loading && <Typography>Loading...</Typography>}
            {error && <Typography color="error">Error loading expenses</Typography>}
            {!loading && !error && expenses.length === 0 && (
              <Typography>No expenses added yet.</Typography>
            )}
            {!loading && !error && expenses.length > 0 && (
              <Box>
                {expenses.map((expense) => (
                  <Box
                    key={expense.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '5px 10px',
                      borderBottom: '1px solid #ccc',
                    }}
                  >
                    <Typography>{expense.title}</Typography>
                    <Typography>${expense.amount.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </PlaceHolderDiv>
        </Grid>
        
      </InnerContainer>
    </ActionCard>
  )
}

export default UserActionCard