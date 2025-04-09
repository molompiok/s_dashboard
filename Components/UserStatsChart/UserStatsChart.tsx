import { useMemo, useState, useEffect, useRef } from 'react';
import { DateTime } from 'luxon';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type PeriodType = 'day' | 'week' | 'month';

interface StatsData {
  visits_stats?: Array<{
    date: string;
    visits: number;
    users_count: number;
    browser?: Record<string, number>;
    os?: Record<string, number>;
    device?: Record<string, number>;
    pageUrl?: Record<string, number>;
    [key: string]: any;
  }>;
  order_stats?: Array<{
    date: string;
    users_count: number;
    orders_count: number;
    total_price: number;
    items_count: number;
    return_delivery_price: number;
    status?: Record<string, number>;
    payment_status?: Record<string, number>;
    payment_method?: Record<string, number>;
    with_delivery?: Record<string, number>;
    [key: string]: any;
  }>;
}

interface StatsChartProps {
  period: PeriodType;
  data: StatsData;
  setAvailable: (available: string[]) => void;
  setResume: (resume: Record<string, { sum: number; average: number }>) => void;
}

// Couleurs prédéfinies pour les datasets
const COLORS = [
  { borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)' },
  { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)' },
  { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)' },
  { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.2)' },
  { borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.2)' },
];

export default function StatsChart({ period, data, setAvailable, setResume }: StatsChartProps) {
  const [currentPeriodStart, setCurrentPeriodStart] = useState(DateTime.now().startOf(period));
  const chartRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const isDragging = useRef(false);
  const startX = useRef<number>(0);
  const accumulatedDelta = useRef<number>(0);

  // Générer les dates pour la période actuelle
  const generateDateRange = useMemo(() => {
    const startDate = currentPeriodStart;
    const endDate = startDate.plus(
      period === 'day' ? { days: 1 } : period === 'week' ? { weeks: 1 } : { months: 1 }
    );
    const dates: string[] = [];
    let currentDate = startDate;

    if (period === 'day') {
      while (currentDate < endDate) {
        dates.push(currentDate.toFormat('yyyy-MM-dd HH'));
        currentDate = currentDate.plus({ hours: 1 });
      }
    } else if (period === 'week') {
      while (currentDate < endDate) {
        dates.push(currentDate.toFormat('yyyy-MM-dd'));
        currentDate = currentDate.plus({ days: 1 });
      }
    } else {
      const endDate = startDate.plus({ weeks: 5 });
      while (currentDate < endDate) {
        const year = currentDate.year;
        const weekNumber = currentDate.weekNumber.toString().padStart(2, '0');
        dates.push(`${year}-${weekNumber}`); // Format yyyy-WW
        currentDate = currentDate.plus({ weeks: 1 });
      }
    }

    return dates;
  }, [period, currentPeriodStart]);

  // Aplatir les données
  const flattenedData = useMemo(() => {
    const allStats = [...(data.visits_stats || []), ...(data.order_stats || [])];
    const result: Record<string, Record<string, number>> = {};

    allStats.forEach((stat) => {
      const dateKey =
        period === 'day'
          ? stat.date.slice(0, 10) + ' ' + (stat.date.slice(11, 13) || '00')
          : period === 'week'
            ? stat.date.slice(0, 10)
            : stat.date; // Utiliser directement yyyy-WW pour 'month'
      result[dateKey] = {};

      Object.entries(stat).forEach(([key, value]) => {
        if (typeof value === 'number') {
          result[dateKey][key] = value;
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            result[dateKey][`${key}.${subKey}`] = subValue as number;
          });
        }
      });
    });

    return result;
  }, [data, period]);

  // Lister les clés disponibles
  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    Object.values(flattenedData).forEach((stat) => {
      Object.keys(stat).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  }, [flattenedData]);

  // Calculer les sommes et moyennes
  const resume = useMemo(() => {
    const result: Record<string, { sum: number; average: number }> = {};
    availableKeys.forEach((key) => {
      const values = Object.values(flattenedData)
        .map((stat) => stat[key] || 0)
        .filter((v) => v !== undefined);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = values.length > 0 ? sum / values.length : 0;
      result[key] = { sum, average };
    });
    return result;
  }, [flattenedData, availableKeys]);

  // Mettre à jour les callbacks
  useEffect(() => {
    setAvailable(availableKeys);
    setResume(resume);
  }, [availableKeys, resume, setAvailable, setResume]);

  // Préparer les données du graphique
  const chartData = useMemo(() => {
    const labels = generateDateRange.map((date) => {
      if (period === 'day') {
        return DateTime.fromFormat(date, 'yyyy-MM-dd HH').toFormat('HH:mm');
      } else if (period === 'week') {
        return DateTime.fromFormat(date, 'yyyy-MM-dd').toFormat('dd MMM');
      } else {
        // Pour 'month', convertir yyyy-WW en date réelle (début de la semaine)
        const [year, week] = date.split('-')
        const dt = DateTime.fromObject({
          weekYear: parseInt(year, 10),
          weekNumber: parseInt(week, 10),
        })

        return dt.toFormat('d MMM') // Exemple: "7 Apr"
      }
    });

    const datasets = availableKeys.map((key, index) => {
      const color = COLORS[index % COLORS.length];
      const dataValues = generateDateRange.map((date) => flattenedData[date]?.[key] || 0);

      return {
        label: key.replace('.', ' - ').toUpperCase(),
        data: dataValues,
        backgroundColor: color.backgroundColor,
        borderColor: color.borderColor,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        // retirer les point sur ligne
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 10,
      };
    });

    return { labels, datasets };
  }, [generateDateRange, flattenedData, availableKeys]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
  }
  
  // Gestion du scroll avec la molette
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const now = Date.now();
    const throttleTime = 200;

    if (now - lastScrollTime.current < throttleTime) return;
    lastScrollTime.current = now;

    const delta = event.deltaY;
    const step =
      period === 'day' ? { hours: 1 } : period === 'week' ? { days: 1 } : { weeks: 1 };

    if (delta > 0) {
      setCurrentPeriodStart((prev) => prev.plus(step));
    } else if (delta < 0) {
      setCurrentPeriodStart((prev) => prev.minus(step));
    }
  };

  // Gestion du drag avec la souris
  const handleMouseDown = (event: MouseEvent) => {
    isDragging.current = true;
    startX.current = event.clientX;
    accumulatedDelta.current = 0;
    if (chartRef.current) {
      chartRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging.current) return;

    const now = Date.now();
    const throttleTime = 50;

    const deltaX = startX.current - event.clientX;
    accumulatedDelta.current += deltaX;

    const stepSize = 100;
    const step =
      period === 'day' ? { hours: 1 } : period === 'week' ? { days: 1 } : { weeks: 1 };

    if (Math.abs(accumulatedDelta.current) >= stepSize && now - lastScrollTime.current >= throttleTime) {
      lastScrollTime.current = now;
      if (accumulatedDelta.current > 0) {
        setCurrentPeriodStart((prev) => prev.plus(step));
      } else {
        setCurrentPeriodStart((prev) => prev.minus(step));
      }
      accumulatedDelta.current = 0;
    }

    startX.current = event.clientX;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (chartRef.current) {
      chartRef.current.style.cursor = 'grab';
    }
  };

  // Gestion du drag tactile
  const handleTouchStart = (event: TouchEvent) => {
    isDragging.current = true;
    startX.current = event.touches[0].clientX;
    accumulatedDelta.current = 0;
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging.current) return;

    const now = Date.now();
    const throttleTime = 50;

    const deltaX = startX.current - event.touches[0].clientX;
    accumulatedDelta.current += deltaX;

    const stepSize = 100;
    const step =
      period === 'day' ? { hours: 1 } : period === 'week' ? { days: 1 } : { weeks: 1 };

    if (Math.abs(accumulatedDelta.current) >= stepSize && now - lastScrollTime.current >= throttleTime) {
      lastScrollTime.current = now;
      if (accumulatedDelta.current > 0) {
        setCurrentPeriodStart((prev) => prev.plus(step));
      } else {
        setCurrentPeriodStart((prev) => prev.minus(step));
      }
      accumulatedDelta.current = 0;
    }

    startX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleTouchCancel = () => {
    isDragging.current = false;
  };

  // Ajouter les événements
  useEffect(() => {
    const chartElement = chartRef.current;
    if (chartElement) {
      chartElement.addEventListener('wheel', handleWheel, { passive: false });
      chartElement.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      chartElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      chartElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      chartElement.addEventListener('touchend', handleTouchEnd);
      chartElement.addEventListener('touchcancel', handleTouchCancel);
    }
    return () => {
      if (chartElement) {
        chartElement.removeEventListener('wheel', handleWheel);
        chartElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        chartElement.removeEventListener('touchstart', handleTouchStart);
        chartElement.removeEventListener('touchmove', handleTouchMove);
        chartElement.removeEventListener('touchend', handleTouchEnd);
        chartElement.removeEventListener('touchcancel', handleTouchCancel);
      }
    };
  }, [period]);

  return (
    <div
      ref={chartRef}
      className="stats-chart-container no-selectable"
      style={{
        width: '100%',
        padding: '10px',
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <Line data={chartData} options={options} height={300} />
    </div>
  );
}

// Exemple de composant parent
interface ParentComponentProps {
  data: StatsData;
}

export function ParentComponent({ data }: ParentComponentProps) {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [available, setAvailable] = useState<string[]>([]);
  const [resume, setResume] = useState<Record<string, { sum: number; average: number }>>({});

  return (
    <div>
      <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodType)}>
        <option value="day">Jour</option>
        <option value="week">Semaine</option>
        <option value="month">Mois</option>
      </select>
      <StatsChart
        period={period}
        data={data}
        setAvailable={setAvailable}
        setResume={setResume}
      />
      <h3>Données disponibles :</h3>
      <ul>{available.map((key) => <li key={key}>{key}</li>)}</ul>
      <h3>Résumé :</h3>
      <ul>
        {Object.entries(resume).map(([key, { sum, average }]) => (
          <li key={key}>{`${key}: Somme = ${sum}, Moyenne = ${average.toFixed(2)}`}</li>
        ))}
      </ul>
    </div>
  );
}