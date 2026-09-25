export interface ProyeccionInstrumento {
  id: number;
  proyeccion_id: number;
  anio: string;
  estado?: string | null; // 'Autorizado' | 'Rechazado' | 'Pendiente'
  motivo?: string | null; // 'Creación' | 'Continuidad' | 'Baja' | 'Sin definir'
  n_expediente?: string | null;
  fecha_desde?: string | null; // date format
  fecha_hasta?: string | null; // date format
  id_resolucion?: number | null;
  orden?: number | null;
  resolucion_ministerial?: string | null;
  resolucion_ministerial_ext?: string | null;
  disposicion_sgnij?: string | null;
  rect_disposoco_sgnij?: string | null;
  resolucion_ministerial_rect1?: string | null;
  resolucion_ministerial_rect2?: string | null;
  resolucion_previa_continuidad?: string | null;
  id_cargo?: number | null;
  id_funcion?: number | null;
  id_turno?: number | null;
  horar?: number | null;
  cargos?: number | null;
  destino_anterior?: string | null;
  destino_nuevo?: string | null;
  observaciones?: string | null;

  // Relationships (populated when eager loaded)
  resolucion?: {
    id: number;
    nombre: string;
    año?: number | null;
    observacion?: string | null;
    url?: string | null;
  };
  cargo?: {
    id: number;
    nombre: string;
    codigo: string;
    tipo?: string | null;
  };
  funcion?: {
    id: number;
    nombre: string;
  };
  turno?: {
    id: number;
    nombre: string;
  };
}

export type PayloadProyeccionInstrumento = Omit<
  ProyeccionInstrumento,
  'id' | 'proyeccion_id' | 'resolucion' | 'cargo' | 'funcion' | 'turno'
>;