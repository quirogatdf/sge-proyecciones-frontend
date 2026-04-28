import { z } from 'zod';

// Enum de ciudades (debe coincidir exactamente con el backend)
const LocalidadEnum = z.enum(['Rio Grande', 'Ushuaia', 'Tolhuin']);

// Schema para el formulario de Institución (create/edit)
export const InstitucionFormSchema = z.object({
  nombre: z.string()
    .min(1, { error: 'El nombre es obligatorio' })
    .max(200, { error: 'El nombre no puede superar los 200 caracteres' }),
  localidad: LocalidadEnum, // Obligatorio: una de las 3 ciudades
  nivel_id: z.number()
    .int({ error: 'Debe seleccionar un nivel válido' })
    .positive({ error: 'Debe seleccionar un nivel válido' }),
  cuise: z.string()
    .min(1, { error: 'El CUISE es obligatorio' })
    .max(4, { error: 'El CUISE no puede tener más de 4 caracteres' })
    .transform(val => val.trim()),
  anexo: z.string()
    .max(20, { error: 'El anexo no puede superar los 20 caracteres' })
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
});

// Schema para la respuesta de la API (con relaciones)
export const InstitucionSchema = InstitucionFormSchema.extend({
  id: z.number().int().positive(),
  nivel: z.object({ // Objeto anidado que devuelve el backend
    id: z.number().int().positive(),
    nombre: z.string(),
    sigla: z.string().nullable(),
  }).optional(),
  created_at: z.string().date(),
  updated_at: z.string().date(),
});

// Tipos inferidos automáticamente
export type InstitucionFormInput = z.input<typeof InstitucionFormSchema>;
export type InstitucionFormOutput = z.output<typeof InstitucionFormSchema>;
export type Institucion = z.infer<typeof InstitucionSchema>;
