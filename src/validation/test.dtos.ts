import { QuestionType } from '@prisma/client';
import { z } from 'zod';

export const createTestSchema = z.object({
  title: z.string().min(3).max(32),
  description: z.string().optional(),
});

export const updateTestInfoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export const publishTestSchema = z.object({
  expiresAt: z
    .string()
    .transform((date) => new Date(date))
    .refine(
      (date) => {
        return date > new Date();
      },
      {
        message: 'Expires at must be in the future',
      }
    )
    .optional(),
  showCorrectAnswers: z.boolean().optional(),
  showQuestionScore: z.boolean().optional(),
});

export const createQuestionSchema = z.object({
  text: z.string(),
  type: z.nativeEnum(QuestionType),
  description: z.string().or(z.null()).optional(),
  score: z.number().optional(),
  options: z
    .array(
      z.object({
        text: z.string(),
        isCorrect: z.boolean(),
      })
    )
    .min(2, {
      message: 'Must have at least 2 options',
    }),
});

export const updateQuestionSchema = z.object({
  text: z.string().optional(),
  type: z.nativeEnum(QuestionType).optional(),
  description: z.string().or(z.null()).optional(),
  score: z.number().optional(),
  options: z
    .array(
      z.object({
        id: z.number().optional(),
        text: z.string(),
        isCorrect: z.boolean().optional(),
      })
    )
    .optional(),
});
