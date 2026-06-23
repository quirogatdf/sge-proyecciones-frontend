import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResolucionesService, Resolucion } from '../../core/services/resoluciones.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-resolucion-detail',
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div class="header-actions">
          <button 
            class="btn btn-secondary" 
            (click)="volverLista()"
          >
            ← Volver a la lista
          </button>
        </div>
        <h1>Detalle de Resolución</h1>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando detalle de resolución...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <p class="error-message">{{ errorMessage() }}</p>
          <button 
            class="btn btn-secondary" 
            (click)="reload()"
          >
            Intentar nuevamente
          </button>
        </div>
      } @else if (!resolucion()) {
        <div class="empty-container">
          <p>Resolución no encontrada</p>
          <button 
            class="btn btn-secondary" 
            (click)="volverLista()"
          >
            Volver a la lista
          </button>
        </div>
      } @else {
        <div class="detail-content">
          <div class="detail-section">
            <h2>Información Básica</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>ID:</label>
                <span>{{ resolucion()?.id }}</span>
              </div>
              <div class="detail-item">
                <label>Nombre:</label>
                <span>{{ resolucion()?.nombre }}</span>
              </div>
              <div class="detail-item">
                <label>Año:</label>
                <span>{{ resolucion()?.['año'] }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Detalles</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Observación:</label>
                <span>{{ resolucion()?.observacion || 'Sin observación' }}</span>
              </div>
              <div class="detail-item">
                <label>URL:</label>
                @if (resolucion()?.url) {
                  <a [href]="resolucion()?.url" target="_blank" rel="noopener noreferrer">
                    {{ resolucion()?.url }}
                  </a>
                } @else {
                  <span>Sin URL</span>
                }
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Fechas</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Creado:</label>
                <span>{{ resolucion()?.created_at }}</span>
              </div>
              <div class="detail-item">
                <label>Actualizado:</label>
                <span>{{ resolucion()?.updated_at }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .loading-container,
    .error-container,
    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
    }

    .loading-spinner {
      width: 3rem;
      height: 3rem;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      color: var(--destructive);
      margin-bottom: 1.5rem;
    }

    .detail-content {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .detail-section {
      padding: 1.5rem;
      border-block-end: 1px solid var(--border);
    }

    .detail-section:last-child {
      border-block-end: none;
    }

    .detail-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .detail-section h2::before {
      content: "";
      width: 4px;
      height: 24px;
      background: var(--primary);
      border-radius: 2px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-item label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      margin-bottom: 0.25rem;
    }

    .detail-item span {
      font-size: 0.875rem;
      color: var(--foreground);
    }

    .detail-item a {
      font-size: 0.875rem;
      color: var(--primary);
      text-decoration: underline;
      word-break: break-all;
    }

    .detail-item a:hover {
      opacity: 0.8;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
      background: var(--surface);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: var(--accent);
      color: var(--foreground);
    }
  `]
})
export class ResolucionDetailComponent {
  private readonly resolucionesService = inject(ResolucionesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  resolucion = signal<Resolucion | null>(null);
  loading = signal(false);
  error = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loadResolucion();
  }

  private loadResolucion() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.error.set(true);
      this.errorMessage.set('ID de resolución no proporcionado');
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      this.error.set(true);
      this.errorMessage.set('ID de resolución inválido');
      return;
    }

    this.loading.set(true);
    this.resolucionesService.getById(id).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.resolucion.set(data as Resolucion);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando detalle de resolución:', err);
        this.error.set(true);
        this.errorMessage.set('No se pudo cargar el detalle de la resolución');
        this.loading.set(false);
      }
    });
  }

  volverLista() {
    this.router.navigate(['/resoluciones']);
  }

  reload() {
    this.error.set(false);
    this.loadResolucion();
  }
}
