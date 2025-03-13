import './Page.css'

export { Page }

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CHART_COLORS = {
  red: '#ff0000',
  blue: '#001faa',
  green: '#007631'
}
const DATA_COUNT = 12;
const labels = [];
for (let i = 0; i < DATA_COUNT; ++i) {
  labels.push('');
}
const datapoints = [0, 5, 3, 4, 5, 6, 10, 11, 5, 6, , 10, 10, 0, 20, 20];

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

function Page() {
  return <>
  <Line ref={(ref) => {
    ref?.canvas && setTimeout(() => {
      ref.canvas && (ref.canvas.style.display = '');
      console.log(ref);

    });

  }} className='min-line-chart no-selectable' style={{ padding: '0px', display: '' }} width={300} height={300} data={{
    labels: Array.from({ length: 12 }, (_, i) => ''),
    datasets: [
      {
        borderColor: '#345',
        data: datapoints,
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.1,
        pointRadius: 0 // This removes the points
      }]
  }} options={options as any} />;
  <Line ref={(ref) => {
    ref?.canvas && setTimeout(() => {
      ref.canvas && (ref.canvas.style.display = '');
      console.log(ref);

    });

  }} className='min-line-chart no-selectable' style={{ padding: '0px', display: '' }} width={300} height={300} data={{
    labels: Array.from({ length: 12 }, (_, i) => ''),
    datasets: [
      {
        borderColor: '#345',
        data: datapoints,
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.1,
        pointRadius: 0 // This removes the points
      }]
  }} options={options as any} />;
  <Line ref={(ref) => {
    ref?.canvas && setTimeout(() => {
      ref.canvas && (ref.canvas.style.display = '');
      console.log(ref);

    });

  }} className='min-line-chart no-selectable' style={{ padding: '0px', display: '' }} width={300} height={300} data={{
    labels: Array.from({ length: 12 }, (_, i) => ''),
    datasets: [
      {
        borderColor: '#345',
        data: datapoints,
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.1,
        pointRadius: 0 // This removes the points
      }]
  }} options={options as any} />;
  <Line ref={(ref) => {
    ref?.canvas && setTimeout(() => {
      ref.canvas && (ref.canvas.style.display = '');
      console.log(ref);

    });

  }} className='min-line-chart no-selectable' style={{ padding: '0px', display: '' }} width={300} height={300} data={{
    labels: Array.from({ length: 12 }, (_, i) => ''),
    datasets: [
      {
        borderColor: '#345',
        data: datapoints,
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.1,
        pointRadius: 0 // This removes the points
      }]
  }} options={options as any} />;
  </>
}
