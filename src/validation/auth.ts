import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email('Ingresá un email válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Ingresá un email válido.')
});

export type AuthFormValues = z.infer<typeof authSchema>;
