import CostumPieChart from "../../CustomGeneralComponents/CustomPieChart";
import PieCard from "../../CustomGeneralComponents/PieCard"
import { useIncomes } from "../../../Hooks/useIncomes";

function PieChartCard() {

  const { incomes, loading, error } = useIncomes();

  const pieData = incomes.map((income, i) => ({
    id: i++,
    value: income.amount,
    label: income.source
  }));

  return (
    <PieCard>
      <CostumPieChart data={pieData} baseColor="#6F8B6D" />
    </PieCard>
  )
}

export default PieChartCard