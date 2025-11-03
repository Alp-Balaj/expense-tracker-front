import styled from "styled-components";
import { Grid } from "@mui/material";

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
const BalanceDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: #6F8B6D;
`

const InnerBalanceDiv = styled.div`
  padding: 5px;
  width: 100%;
  border-radius: 10px;
  background-color: #E7E7E7;
`


function UserActionCard() {
  return (
    <ActionCard>
      <InnerContainer>

        <Grid container spacing={1} sx={{height:'15%'}}>
          <Grid size={6}>
            <ButtonDiv>

            </ButtonDiv>
          </Grid>
          <Grid size={6} sx={{height: '100%'}}>
              <Grid container spacing={1} sx={{height:'100%', padding: '5px', backgroundColor: '#6F8B6D', borderRadius: '10px'}}>
                <InnerBalanceDiv>

                </InnerBalanceDiv>
              </Grid>
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{height:'80%'}}>
          <PlaceHolderDiv/>
        </Grid>
        
      </InnerContainer>
    </ActionCard>
  )
}

export default UserActionCard