import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email({ message: 'Invalid email' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, {
      message: 'Password must be at least 6 characters',
    })
    .max(32, {
      message: 'Password must be at most 32 characters',
    }),
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(3, {
      message: 'Full name must be at least 3 characters',
    })
    .max(32, {
      message: 'Full name must be at most 32 characters',
    }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }),
  newPassword: z.string({ required_error: 'New password is required' }).min(6, {
    message: 'Password must be at least 6 characters',
  }),
  confirmNewPassword: z
    .string({
      required_error: 'Confirm new password is required',
    })
    .min(6, {
      message: 'Password must be at least 6 characters',
    }),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
