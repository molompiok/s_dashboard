import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CHART_COLORS = {
    red:'#ff0000',
    blue:'#001faa',
    green:'#007631'
}
const DATA_COUNT = 12;
const labels = [];
for (let i = 0; i < DATA_COUNT; ++i) {
  labels.push('');
}
const datapoints = [0, 5, 3, 4, 5, 6, 10, 11,5, 6, , 10, 10, 0, 20, 20];

const options = {
  responsive: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: false
    },
  },
  scales: {
    x: {
      display: false
    },
    y: {
      display: false
    }
  }
};

function MyChart({color,height,width}:{color?: keyof typeof CHART_COLORS, width?: number, height?: number}) {
  return <Line className='min-line-chart' style={{padding:'10px'}} width={width||110} height={height||60} data={{
    labels: Array.from({ length: 12}, (_, i) => ''),
    datasets: [
      {
         borderColor: CHART_COLORS[color||'blue'],
         data: datapoints,
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.1,
        pointRadius: 0 // This removes the points
      }]
  }} options={options as any} />;
}

export default MyChart;