import { z } from 'zod';

// Schema para el formulario de Nivel (create/edit)
// Sigla es opcional, nombre obligatorio
export const NivelFormSchema = z.object({
  nombre: z.string()
    .min(1, { error: 'El nombre es obligatorio' })
    .max(100, { error: 'El nombre no puede superar los 100 caracteres' }),
  sigla: z.string()
    .max(10, { error: 'La sigla no puede tener más de 10 caracteres' })
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
});

// Schema para la respuesta de la API (incluye id, fechas)
export const NivelSchema = NivelFormSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string().date(),
  updated_at: z.string().date(),
});

// Tipos inferidos automáticamente (¡reemplazan las interfaces manuales!)
export type NivelFormInput = z.input<typeof NivelFormSchema>;
export type NivelFormOutput = z.output<typeof NivelFormSchema>;
export type Nivel = z.infer<typeof NivelSchema>; // Equivalente a la interfaz Nivel actual
