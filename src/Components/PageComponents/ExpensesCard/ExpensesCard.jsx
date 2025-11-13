import styled from "styled-components"
import ExPieChartCard from "./ExPieChartCard";
import ExUserActionCard from "./ExUserActionCard";
import { Grid } from "@mui/material";


const Card = styled.div`
  width: 100% !important;
  background-color: #8D4240 !important;
  border-radius: 10px;
`;


function ExpensesCard() {
  return (
    <Card>
        <Grid container spacing={1} sx={{padding: '5px', height:'100%'}}>
            <Grid size={7}>
                <ExUserActionCard/>
            </Grid>
            <Grid size={5}>
                <ExPieChartCard/>
            </Grid>
        </Grid>
    </Card>
  )
}

export default ExpensesCard;