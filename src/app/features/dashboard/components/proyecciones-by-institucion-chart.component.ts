import {
  Component,
  input,
  effect,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from '@angular/core';
import { Chart, ChartConfig } from '../../../core/utils/chart';
import { StatsByInstitucion } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-proyecciones-by-institucion-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 300px;
      }
      .chart-container {
        position: relative;
        height: 100%;
      }
      canvas {
        width: 100% !important;
        height: 100% !important;
      }
    `,
  ],
})
export class ProyeccionesByInstitucionChartComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly stats = input.required<StatsByInstitucion>();
  readonly chartId = input<string>('proyecciones-by-institucion-chart');

  private chartInstance: Chart | null = null;
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    effect(() => {
      const data = this.stats();
      if (data && data.length > 0) {
        this.renderChart(data);
      } else {
        this.destroyChart();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.destroyChart();
    });
  }

  private renderChart(data: StatsByInstitucion): void {
    this.destroyChart();

    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = data.map((item) => item.institucion);

    const config: ChartConfig = {
      type: 'bar',
      labels,
      datasets: [
        {
          label: 'Creación - Cargos',
          data: data.map((item) => item.creacion_no_h),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Creación - Horas',
          data: data.map((item) => item.creacion_horas_h),
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Continuidad - Cargos',
          data: data.map((item) => item.continuidad_no_h),
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 1,
        },
        {
          label: 'Continuidad - Horas',
          data: data.map((item) => item.continuidad_horas_h),
          backgroundColor: 'rgba(249, 115, 22, 0.3)',
          borderColor: 'rgba(249, 115, 22, 1)',
          borderWidth: 1,
        },
      ],
      title: 'Proyecciones por Institución',
    };

    this.chartInstance = new Chart(ctx, {
      type: config.type,
      data: {
        labels: config.labels,
        datasets: config.datasets.map((ds) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.backgroundColor,
          borderColor: ds.borderColor,
          borderWidth: ds.borderWidth,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!config.title,
            text: config.title,
          },
          legend: {
            display: true,
            position: 'bottom',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  }

  private destroyChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
