import styled from "styled-components"
import { Grid } from "@mui/material";
import SavingsCard from "./SavingsCard";
import BillsCard from "./BillsCard";


const Card = styled.div`
  width: 100% !important;
  background-color: #3F7CD8 !important;
  border-radius: 10px;
`;


function SAndBCard() {
  return (
    <Card>
        <Grid container spacing={1} sx={{padding: '5px', height:'100%'}}>
            <Grid size={6}>
                <SavingsCard/>
            </Grid>
            <Grid size={6}>
                <BillsCard/>
            </Grid>
        </Grid>
    </Card>
  )
}

export default SAndBCard