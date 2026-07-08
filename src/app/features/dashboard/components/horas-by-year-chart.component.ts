import { Component, input, effect, ElementRef, viewChild, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { Chart, ChartConfig } from '../../../core/utils/chart';
import { HorasByYear } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-horas-by-year-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
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
  `],
})
export class HorasByYearChartComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly horasByYear = input.required<HorasByYear>();
  readonly chartId = input<string>('horas-by-year-chart');

  private chartInstance: Chart | null = null;
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    effect(() => {
      const data = this.horasByYear();
      if (data && data.length > 0) {
        this.renderChart(data);
      } else {
        this.destroyChart();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroyChart();
    });
  }

  private renderChart(data: HorasByYear): void {
    this.destroyChart();

    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfig = {
      type: 'bar',
      labels: data.map((item: { year: number; totalHoras: number }) => `${item.year} (${item.totalHoras})`),
      datasets: [
        {
          label: 'Horas',
          data: data.map((item: { year: number; totalHoras: number }) => item.totalHoras),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
      ],
      title: 'Horas por Año',
    };

    this.chartInstance = new Chart(ctx, {
      type: config.type,
      data: {
        labels: config.labels,
        datasets: config.datasets.map(ds => ({
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
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
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
