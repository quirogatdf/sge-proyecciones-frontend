import type { PayloadProyeccionInstrumento, ProyeccionInstrumento } from './proyeccion-instrumento';

/**
 * Payload para crear la "plaza" (paso 1 del wizard).
 * Solo vive en `proyecciones`.
 */
export interface PayloadProyeccionPlaza {
  id_nivel: number | null;
  id_institucion: number | null;
  id_puesto?: string | null;
}

/**
 * Payload para crear una plaza + su primer instrumento de forma atómica
 * (pasos 1 + 2 del wizard en un solo POST).
 */
export interface PayloadProyeccionConInstrumento extends PayloadProyeccionPlaza {
  instrumento?: PayloadProyeccionInstrumento;
}

export interface Proyeccion {
  id: number;
  id_nivel: number | null;
  id_institucion: number | null;
  id_puesto?: string | null;

  // Año en foco (el del instrumento vigente)
  instrumento_id?: number | null;
  anio?: string | null;
  año?: string | null;

  // Datos del instrumento del año en foco (varían por año).
  // Si la plaza no tiene instrumento para el año, son null.
  estado?: string | null; // 'Autorizado' | 'Rechazado' | 'Pendiente'
  n_expediente?: string | null;
  motivo?: string | null; // 'Creación' | 'Continuidad' | 'Baja' | 'Sin definir'
  orden?: string | null;
  horar?: number | null;
  cargos?: number | null;
  id_cargo?: number | null;
  id_funcion?: number | null;
  id_turno?: number | null;
  fecha_desde?: string | null; // date format
  fecha_hasta?: string | null; // date format
  id_resolucion?: number | null;
  resolucion_ministerial?: string | null; // @deprecated - usar id_resolucion -> resolucion.nombre
  resolucion_ministerial_ext?: string | null;
  disposicion_sgnij?: string | null;
  rect_disposoco_sgnij?: string | null;
  resolucion_previa_continuidad?: string | null;
  resolucion_ministerial_rect1?: string | null;
  resolucion_ministerial_rect2?: string | null;
  destino_anterior?: string | null;
  destino_nuevo?: string | null;

  // Relationships (populated when eager loaded)
  nivel?: {
    id: number;
    nombre: string;
    sigla?: string | null;
  };
  cargo?: {
    id: number;
    nombre: string;
    codigo: string;
    tipo?: string | null;
  } | null;
  funcion?: {
    id: number;
    nombre: string;
  } | null;
  turno?: {
    id: number;
    nombre: string;
  } | null;
  institucion?: {
    id: number;
    nombre: string;
    localidad: string; // Campo agregado para mostrar la ciudad
  };
  resolucion?: {
    id: number;
    nombre: string;
    año?: number | null;
    observacion?: string | null;
    url?: string | null;
  } | null;

  // Historial completo (solo en el detalle)
  instrumentos?: ProyeccionInstrumento[];
}
