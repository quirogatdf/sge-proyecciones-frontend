import { z } from 'zod';

// Schema para el formulario de Función/Perfil (create/edit)
export const FuncionFormSchema = z.object({
  nombre: z.string()
    .min(1, { error: 'El nombre es obligatorio' })
    .max(255, { error: 'El nombre no puede superar los 255 caracteres' }),
  sigla: z.string()
    .max(10, { error: 'La sigla no puede superar los 10 caracteres' })
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
});

// Schema para la respuesta de la API
export const FuncionSchema = FuncionFormSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string().date(),
  updated_at: z.string().date(),
});

// Tipos inferidos automáticamente
export type FuncionFormInput = z.input<typeof FuncionFormSchema>;
export type FuncionFormOutput = z.output<typeof FuncionFormSchema>;
export type Funcion = z.infer<typeof FuncionSchema>;