import { Component, input, effect, ElementRef, viewChild, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { Chart, ChartConfig } from '../../../core/utils/chart';
import { CargosByNivel } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-cargos-by-nivel-chart',
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
export class CargosByNivelChartComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly cargosByNivel = input.required<CargosByNivel>();
  readonly chartId = input<string>('cargos-by-nivel-chart');

  private chartInstance: Chart | null = null;
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    effect(() => {
      const data = this.cargosByNivel();
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

  private renderChart(data: CargosByNivel): void {
    this.destroyChart();

    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate colors for bars
    const backgroundColors = [
      'rgba(59, 130, 246, 0.5)',
      'rgba(239, 68, 68, 0.5)',
      'rgba(34, 197, 94, 0.5)',
      'rgba(234, 179, 8, 0.5)',
      'rgba(168, 85, 247, 0.5)',
    ];

    const borderColors = [
      'rgba(59, 130, 246, 1)',
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
          label: 'Cargos',
          data: data.map(item => item.count),
          backgroundColor: backgroundColors.slice(0, data.length),
          borderColor: borderColors.slice(0, data.length),
          borderWidth: 1,
        },
      ],
      title: 'Cargos por Nivel',
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
