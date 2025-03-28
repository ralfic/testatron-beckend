import { QuestionType } from '@prisma/client';
import { z } from 'zod';

export const updateTestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
  showOptionsScore: z.boolean().optional(),
  questions: z
    .array(
      z.object({
        id: z.number().optional(),
        text: z.string().optional(),
        type: z.nativeEnum(QuestionType).optional(),
        isRequired: z.boolean().optional(),
        score: z.number().optional(),
        options: z
          .array(
            z.object({
              id: z.number().optional(),
              text: z.string().optional(),
              isCorrect: z.boolean().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
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
});

export const answersTestSchema = z
  .array(z.object({ questionId: z.number(), optionId: z.number() }))
  .optional();

export type AnswersTest = z.infer<typeof answersTestSchema>;
