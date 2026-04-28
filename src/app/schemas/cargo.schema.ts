import { z } from 'zod';

// Schema para el formulario de Cargo (create/edit)
export const CargoFormSchema = z.object({
  codigo: z.string()
    .min(1, { error: 'El código es obligatorio' })
    .max(20, { error: 'El código no puede superar los 20 caracteres' })
    .transform(val => val.trim().toUpperCase()), // Códigos siempre en mayúscula
  nombre: z.string()
    .min(1, { error: 'El nombre es obligatorio' })
    .max(100, { error: 'El nombre no puede superar los 100 caracteres' }),
  descripcion: z.string()
    .max(500, { error: 'La descripción no puede superar los 500 caracteres' })
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
});

// Schema para la respuesta de la API
export const CargoSchema = CargoFormSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string().date(),
  updated_at: z.string().date(),
});

// Tipos inferidos (reemplazan interfaces manuales)
export type CargoFormInput = z.input<typeof CargoFormSchema>;
export type CargoFormOutput = z.output<typeof CargoFormSchema>;
export type Cargo = z.infer<typeof CargoSchema>; // Equivalente a la interfaz Cargo actual
