import PieCard from "../../CustomGeneralComponents/PieCard"
import CustomPieChart from "../../CustomGeneralComponents/CustomPieChart";
import { useExpenses } from "../../../Hooks/useExpenses";

function ExPieChartCard() {

  const { expenses, loading, error } = useExpenses();

  const pieData = expenses.map((expense, i) => ({
    id: i++,
    value: expense.amount,
    label: expense.category
  }));

  console.log(expenses);

  return (
    <PieCard>
      <CustomPieChart data={pieData} baseColor="#8D4240" />
    </PieCard>
  )
}

export default ExPieChartCard;