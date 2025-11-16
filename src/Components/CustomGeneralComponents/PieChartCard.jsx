import CustomPieChart from "../CustomGeneralComponents/CustomPieChart";
import { useAppAuthApi } from '../../Hooks/useAppAuthApi';
import { useState, useEffect } from 'react';
import { PieCard } from './StyledComponents';

function PieChartCard(url) {

  const { getAllData, deleteData, putData, postData } = useAppAuthApi();
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllData(url);
      setData(data);
    };

    fetchData();
  }, []);

  const pieData = data.map((expense, i) => ({
    id: i++,
    value: expense.amount,
    label: expense.category
  }));

  return (
    <PieCard>
      <CustomPieChart data={pieData} baseColor="#8D4240" />
    </PieCard>
  )
}

export default PieChartCard;