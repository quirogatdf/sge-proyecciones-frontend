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

// Schema for instituciones response (basic, for selector)
export const InstitucionSchema = z.object({
  id: z.string(),
  nombre: z.string(),
});

export const InstitucionesSchema = z.array(InstitucionSchema);

// Type exports
export type CargosByYear = z.infer<typeof CargosByYearSchema>;
export type CargosByNivel = z.infer<typeof CargosByNivelSchema>;
export type Institucion = z.infer<typeof InstitucionSchema>;
export type Instituciones = z.infer<typeof InstitucionesSchema>;
