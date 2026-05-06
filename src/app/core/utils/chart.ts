// Chart.js tree-shaking setup - only import what we need
import {
  Chart,
  BarController,
  PieController,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

// Register only the controllers and elements we need
Chart.register(
  BarController,
  PieController,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

// Re-export Chart for use in components
export { Chart };

// Helper type for chart data
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartConfig {
  type: 'bar' | 'pie';
  labels: string[];
  datasets: ChartDataset[];
  title?: string;
}
