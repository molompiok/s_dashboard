//pages/index/MiniChart.tsx;
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CHART_COLORS = {
  red:'#ff0000',
  blue:'#001faa',
  green:'#007631',
  redLight:'#ff0000',
  blueLight:'#001faa',
  greenLight:'#00c631',
}
const DATA_COUNT = 12;
const labels = [];
for (let i = 0; i < DATA_COUNT; ++i) {
  labels.push('');
}


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

function MyChart({color,height,width,datasets}:{datasets?:number[],color?: keyof typeof CHART_COLORS, width?: number, height?: number}) {
  // data = data || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  // console.log('data',datasets);
  
  return datasets && <Line  ref={(ref)=>{
    ref?.canvas && setTimeout(() => {
      ref.canvas && (ref.canvas.style.display = '');
     });

  }} className='min-line-chart no-selectable' style={{ padding:'0px', display:''}} width={width||110} height={height||60} data={{
    labels: Array.from({ length: 12}, (_, i) => ''),
    datasets: [
      {
         borderColor: CHART_COLORS[color||'blue'],
         data:datasets,
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.1,
        pointRadius: 0 // This removes the points
      }]
  }} options={options as any} />;
}

export default MyChart;