import { z } from 'zod';

export const changeAccountDetailsSchema = z.object({
  fullName: z.string().min(3).max(32).optional(),
});
