import { Component, input, effect, ElementRef, viewChild, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { Chart, ChartConfig } from '../../../core/utils/chart';
import { HorasByNivel } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-horas-by-nivel-chart',
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
export class HorasByNivelChartComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly horasByNivel = input.required<HorasByNivel>();
  readonly chartId = input<string>('horas-by-nivel-chart');

  private chartInstance: Chart | null = null;
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    effect(() => {
      const data = this.horasByNivel();
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

  private renderChart(data: HorasByNivel): void {
    this.destroyChart();

    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate colors for bars
    const backgroundColors = [
      'rgba(16, 185, 129, 0.5)',
      'rgba(239, 68, 68, 0.5)',
      'rgba(34, 197, 94, 0.5)',
      'rgba(234, 179, 8, 0.5)',
      'rgba(168, 85, 247, 0.5)',
    ];

    const borderColors = [
      'rgba(16, 185, 129, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(234, 179, 8, 1)',
      'rgba(168, 85, 247, 1)',
    ];

    const config: ChartConfig = {
      type: 'bar',
      labels: data.map(item => item.nivel_nombre),
      datasets: [
        {
          label: 'Horas',
          data: data.map(item => item.totalHoras),
          backgroundColor: backgroundColors.slice(0, data.length),
          borderColor: borderColors.slice(0, data.length),
          borderWidth: 1,
        },
      ],
      title: 'Horas por Nivel',
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
            display: true,
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
