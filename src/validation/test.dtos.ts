import { QuestionType } from '@prisma/client';
import { z } from 'zod';

export const createTestSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(
    z.object({
      text: z.string(),
      type: z.nativeEnum(QuestionType),
      isRequired: z.boolean().optional(),
      options: z.array(z.object({ text: z.string(), isCorrect: z.boolean() })),
    })
  ),
});

export const answersTestSchema = z
  .array(z.object({ questionId: z.number(), optionId: z.number() }))
  .optional();

export type CreateTestData = z.infer<typeof createTestSchema>;
export type AnswersTest = z.infer<typeof answersTestSchema>;
