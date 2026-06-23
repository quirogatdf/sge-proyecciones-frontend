import { z } from 'zod';

export const ResolucionFormSchema = z.object({
  nombre: z.string()
    .min(1, { error: 'El nombre es obligatorio' })
    .max(255, { error: 'El nombre no puede superar los 255 caracteres' }),

  año: z.number()
    .int({ error: 'El año debe ser un número entero' })
    .min(1900, { error: 'El año debe ser mayor o igual a 1900' })
    .max(new Date().getFullYear() + 10, { error: 'El año no puede superar ' + (new Date().getFullYear() + 10) }),

  observacion: z.string()
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),

  url: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? null : val),
    z.url({ error: 'La URL debe tener un formato válido' })
      .nullable()
      .optional()
      .transform(val => val ?? null)
  ),
});

export const ResolucionSchema = ResolucionFormSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ResolucionFormInput = z.input<typeof ResolucionFormSchema>;
export type ResolucionFormOutput = z.output<typeof ResolucionFormSchema>;
export type Resolucion = z.infer<typeof ResolucionSchema>;
