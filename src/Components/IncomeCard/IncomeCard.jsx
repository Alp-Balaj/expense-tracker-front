import styled from "styled-components"
import PieChartCard from "./PieChartCard";
import UserActionCard from "./UserActionCard";
import { Grid } from "@mui/material";


const Card = styled.div`
  width: 100% !important;
  background-color: #6F8B6D !important;
  border-radius: 10px;
`;


function IncomeCard() {
  return (
    <Card>
        <Grid container spacing={1} sx={{padding: '5px', height:'100%'}}>
            <Grid size={5}>
                <PieChartCard/>
            </Grid>
            <Grid size={7}>
                <UserActionCard/>
            </Grid>
        </Grid>
    </Card>
  )
}

export default IncomeCard