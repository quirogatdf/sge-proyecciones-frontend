import { z } from 'zod';

// Schema for cargos by year response: [{ year: number, count: number }]
export const CargosByYearSchema = z.array(
  z.object({
    year: z.number(),
    count: z.number(),
  })
);

// Schema for cargos by nivel response: [{ nivel_nombre: string, count: number }]
export const CargosByNivelSchema = z.array(
  z.object({
    nivel_nombre: z.string(),
    count: z.number(),
  })
);

// Schema for instituciones response (for selector)
export const InstitucionSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cuise: z.string().nullable().optional(),
});

export const InstitucionesSchema = z.array(InstitucionSchema);

// Schema for proyecciones by institution stats
export const StatsByInstitucionSchema = z.array(
  z.object({
    institucion_id: z.number(),
    institucion: z.string(),
    creacion_no_h: z.number(),
    creacion_horas_h: z.number(),
    continuidad_no_h: z.number(),
    continuidad_horas_h: z.number(),
  })
);

// Schema for horas by year response: [{ year: number, totalHoras: number }]
export const HorasByYearSchema = z.array(
  z.object({
    year: z.number(),
    totalHoras: z.number(),
  })
);

// Schema for horas by nivel response: [{ nivel_nombre: string, totalHoras: number }]
export const HorasByNivelSchema = z.array(
  z.object({
    nivel_nombre: z.string(),
    totalHoras: z.number(),
  })
);

// Type exports
export type CargosByYear = z.infer<typeof CargosByYearSchema>;
export type CargosByNivel = z.infer<typeof CargosByNivelSchema>;
export type HorasByYear = z.infer<typeof HorasByYearSchema>;
export type HorasByNivel = z.infer<typeof HorasByNivelSchema>;
export type Institucion = z.infer<typeof InstitucionSchema>;
export type Instituciones = z.infer<typeof InstitucionesSchema>;
export type StatsByInstitucion = z.infer<typeof StatsByInstitucionSchema>;
