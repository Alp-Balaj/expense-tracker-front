import styled from "styled-components";
import { Button, Grid } from "@mui/material";
import { useAppAuthApi } from "../../../Hooks/useAppAuthApi";
import { useState, useEffect } from "react";
import { ExpenseModal } from "../../PageComponents/ExpensesCard/ExpenseModal";
import ExpenseList from "../../PageComponents/ExpensesCard/ExpenseList";


//#region 
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

const TotalExepensesDiv = styled.div`
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


function HomeCard() {

  const { getAllData, postData } = useAppAuthApi();
  const [data, setData] = useState([]);
  
  const url = 'api/Expense'

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllData(url);
      setData(data);
    };

    fetchData();
  }, []);

  const totalExpenses = data.reduce((sum, e) => sum + e.amount, 0);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <ActionCard>
      <InnerContainer>

        <Grid container spacing={1} sx={{height:'15%'}}>
          <Grid size={6} sx={{height: '100%'}}>
              <Grid container spacing={1} sx={{height:'100%', padding: '5px', backgroundColor: '#8D4240', borderRadius: '10px'}}>
                <TotalExepensesDiv>
                  <H1>
                    Total Expenses
                  </H1>
                  <H1>
                    ${totalExpenses.toFixed(2)}
                  </H1>
                </TotalExepensesDiv>
              </Grid>
          </Grid>
          <Grid size={6}>
            <ButtonDiv>
              <Button 
              variant="contained" color="red" sx={{ width: '100%', height: '100%', color: 'white' }}
              onClick={handleOpen} >
                Add Expense
              </Button>
            </ButtonDiv>
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{height:'80%'}}>
          <PlaceHolderDiv>
            <ExpenseList/>
          </PlaceHolderDiv>
        </Grid>
        
      </InnerContainer>

      <ExpenseModal
        open={open}
        handleClose={handleClose}
        onSave={postData}
      />

        
    </ActionCard>
  )
}

export default HomeCard