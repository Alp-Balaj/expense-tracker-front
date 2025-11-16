import { Grid, Stack } from "@mui/material";
import UserDashboard from "../Components/PageComponents/Dashboard/UserDashboard";
import UserGraph from "../Components/PageComponents/Dashboard/UserGraph";
import './HomePageStyle.css';
import HomeCard from "../Components/CustomGeneralComponents/HomeCard/HomeCard";
import Sidebar from "../Components/Sidebar/Sidebar"

const HomePage = () => {
  return (
    <div>

      <div className="dashboard">
        <div className="container">
          <Grid container spacing={2} sx={{height: "100%"}}>
            <Grid size={3}>
              <UserDashboard/>
            </Grid>
            <Grid size={9}>
              <UserGraph/>
            </Grid>
          </Grid>
        </div>
      </div>

      <div className="hero">
        <div className="container">
          <div className="heroContainer">
            <Grid container spacing={2} sx={{padding: '15px'}}>
              <Grid size={10}>
                <Stack spacing={2}>
                  <HomeCard/>
                </Stack>
              </Grid>
              <Grid size={2}>
                  <Sidebar/>
              </Grid>
            </Grid>
          </div>
        </div>
      </div>

      <div className="footer">
        <div className="container">

        </div>
      </div>

    </div>
  )
}

export default HomePage