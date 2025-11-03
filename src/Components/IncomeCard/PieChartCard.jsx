import styled from "styled-components";
import CostumPieChart from "../CustomGeneralComponents/CustomPieChart";

const PieCard = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #E7E7E7;
  border-radius: 10px;
`;

const pieData = [ 
    { id: 0, value: 10, label: 'series A' },
    { id: 1, value: 15, label: 'series B' },
    { id: 2, value: 20, label: 'series C' },
  ]

function PieChartCard() {
  return (
    <PieCard>
      <CostumPieChart data={pieData} baseColor="#6F8B6D" />
    </PieCard>
  )
}

export default PieChartCard