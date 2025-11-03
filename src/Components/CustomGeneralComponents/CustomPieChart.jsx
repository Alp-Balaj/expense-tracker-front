import { PieChart } from '@mui/x-charts/PieChart';
import { generateGradient } from '../../Logic/PieChartColors';

function CustomPieChart({ data, baseColor }) {

  const generatedColors = generateGradient(baseColor, data.length);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <PieChart
        series={[
          {
            data: data,
            highlightScope: { fade: 'global', highlight: 'item' },
          },
        ]}
        colors= { generatedColors }
        hideLegend={true}
      />
    </div>
  );
}

export default CustomPieChart;
