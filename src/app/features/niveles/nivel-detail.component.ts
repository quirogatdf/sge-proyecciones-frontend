import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NivelesService, Nivel } from '../../core/services/niveles.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-nivel-detail',
  standalone: true,
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
        <h1>Detalle de Nivel</h1>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando detalle de nivel...</p>
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
      } @else if (!nivel()) {
        <div class="empty-container">
          <p>Nivel no encontrado</p>
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
                <span>{{ nivel()?.id }}</span>
              </div>
              <div class="detail-item">
                <label>Nombre:</label>
                <span>{{ nivel()?.nombre }}</span>
              </div>
              <div class="detail-item">
                <label>Sigla:</label>
                <span>{{ nivel()?.sigla || 'Sin sigla' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h2>Fechas</h2>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Creado:</label>
                <span>{{ nivel()?.created_at }}</span>
              </div>
              <div class="detail-item">
                <label>Actualizado:</label>
                <span>{{ nivel()?.updated_at }}</span>
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
export class NivelDetailComponent {
  private readonly nivelesService = inject(NivelesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  nivel = signal<Nivel | null>(null);
  loading = signal(false);
  error = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loadNivel();
  }

  private loadNivel() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.error.set(true);
      this.errorMessage.set('ID de nivel no proporcionado');
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      this.error.set(true);
      this.errorMessage.set('ID de nivel inválido');
      return;
    }

    this.loading.set(true);
    this.nivelesService.getById(id).subscribe({
      next: (res: any) => {
        const data = res.data;
        this.nivel.set(data as Nivel);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando detalle de nivel:', err);
        this.error.set(true);
        this.errorMessage.set('No se pudo cargar el detalle del nivel');
        this.loading.set(false);
      }
    });
  }

  volverLista() {
    this.router.navigate(['/niveles']);
  }

  reload() {
    this.error.set(false);
    this.loadNivel();
  }
}
