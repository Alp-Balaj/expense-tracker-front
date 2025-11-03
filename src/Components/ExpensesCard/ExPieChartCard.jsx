import styled from "styled-components";
import CustomPieChart from "../CustomGeneralComponents/CustomPieChart";

const ExPieCard = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #E7E7E7;
  border-radius: 10px;
`;

const pieData = [ 
    { id: 0, value: 10, label: 'series A' },
    { id: 1, value: 15, label: 'series B' },
    { id: 2, value: 20, label: 'series C' },
    { id: 3, value: 15, label: 'series D' },
    { id: 4, value: 10, label: 'series E' },
    { id: 5, value: 18, label: 'series F' },
  ]

function ExPieChartCard() {
  return (
    <ExPieCard>
      <CustomPieChart data={pieData} baseColor="#8D4240" />
    </ExPieCard>
  )
}

export default ExPieChartCard;