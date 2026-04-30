export interface Proyeccion {
  id: number;
  id_nivel: number | null;
  estado: string; // 'Autorizado' | 'Rechazado' | 'Pendiente'
  n_expediente?: string | null;
  motivo: string; // 'Creación' | 'Continuidad' | 'Baja' | 'Sin definir'
  orden?: string | null;
  horar?: number | null;
  cargos?: number | null;
  id_cargo?: number | null;
  id_funcion?: number | null;
  id_turno?: number | null;
  fecha_desde: string; // date format
  fecha_hasta?: string | null; // date format
  id_institucion: number | null;
  resolucion_ministerial?: string | null;
  resolucion_ministerial_ext?: string | null;
  disposicion_sgnij?: string | null;
  rect_disposoco_sgnij?: string | null;
  
  // Relationships (populated when eager loaded)
  nivel?: {
    id: number;
    nombre: string;
    sigla?: string | null;
  };
  cargo?: {
    id: number;
    nombre: string;
  };
  funcion?: {
    id: number;
    nombre: string;
  };
  turno?: {
    id: number;
    nombre: string;
  };
  institucion?: {
    id: number;
    nombre: string;
  };
}