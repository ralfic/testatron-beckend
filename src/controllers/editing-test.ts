import { prisma } from '@/server';
import {
  createQuestionSchema,
  createTestSchema,
  publishTestSchema,
  updateQuestionSchema,
  updateTestInfoSchema,
} from '@/validation/test.schemas';
import { TestStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { customAlphabet } from 'nanoid';

const generateUniqueCode = async (): Promise<string> => {
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
  let code: string;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    code = nanoid();
    const existingTest = await prisma.test.findUnique({ where: { code } });
    exists = !!existingTest;
    attempts++;
  }

  if (exists) {
    throw new Error('Failed to generate a unique test code');
  }

  return code!;
};

export const updateTestInfo = async (req: Request, res: Response) => {
  const validation = updateTestInfoSchema.safeParse(req.body);

  const testId = Number(req.params.testId);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  if (!testId) {
    res.status(404).json({ message: 'Id must be provided' });
    return;
  }

  try {
    await prisma.test.update({
      where: { id: testId },
      data: {
        title: validation.data.title,
        description: validation.data.description,
        expiresAt: validation.data.expiresAt,
        showCorrectAnswers: validation.data.showCorrectAnswers,
        showQuestionScore: validation.data.showQuestionScore,
      },
    });

    res.status(200).json({ message: 'Test updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTest = async (req: Request, res: Response) => {
  const validation = createTestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const newTest = await prisma.test.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        authorId: req.user.id,
      },
    });

    res.status(201).json(newTest);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error ' });
  }
};

export const deleteTest = async (req: Request, res: Response) => {
  const testId = Number(req.params.testId);

  if (isNaN(testId)) {
    res.status(400).json({ message: 'Invalid test ID' });
    return;
  }

  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    await prisma.test.delete({ where: { id: testId } });

    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const publishTest = async (req: Request, res: Response) => {
  const validation = publishTestSchema.safeParse(req.body);

  const testId = Number(req.params.testId);

  if (!testId) {
    res.status(404).json({ message: 'Test not found' });
    return;
  }

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  try {
    const code = await generateUniqueCode();

    await prisma.test.update({
      where: { id: testId },
      data: {
        status: TestStatus.PUBLISHED,
        expiresAt: validation.data?.expiresAt,
        code: code,
        showCorrectAnswers: validation.data?.showCorrectAnswers,
        showQuestionScore: validation.data?.showQuestionScore,
      },
    });

    res.status(200).json({ message: 'Test published successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createQuestion = async (req: Request, res: Response) => {
  const validation = createQuestionSchema.safeParse(req.body);

  const testId = Number(req.params.testId);

  if (!testId) {
    res.status(404).json({ message: 'Id must be provided' });
    return;
  }

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  try {
    const testExists = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!testExists) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          testId: testId,
          description: validation.data.description,
          score: validation.data.score,
          text: validation.data.text,
          type: validation.data.type,
        },
      });
      await tx.option.createMany({
        data: validation.data.options.map((option) => ({
          questionId: question.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      });
    });

    res.status(201).json({
      message: 'Question created successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateQuestion = async (req: Request, res: Response) => {
  const validation = updateQuestionSchema.safeParse(req.body);

  const questionId = Number(req.params.id);
  const testId = Number(req.params.testId);

  if (!questionId || !testId) {
    res.status(404).json({ message: 'Ids must be provided' });
    return;
  }

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const question = await tx.question.update({
        where: { id: questionId },
        data: {
          description: validation.data.description,
          score: validation.data.score,
          text: validation.data.text,
          type: validation.data.type,
        },
        include: {
          options: true,
        },
      });

      const existingOptionsId = question?.options.map((option) => option.id);
      const currentOptionsId =
        validation.data?.options?.map((option) => option.id) ?? [];
      const optionsToDelete = existingOptionsId?.filter(
        (id) => !currentOptionsId.includes(id)
      );

      if (validation.data.options) {
        Promise.all(
          validation.data.options.map(async (option) => {
            await prisma.option.upsert({
              where: { id: option.id ?? -1 },
              update: {
                text: option.text,
                isCorrect: option.isCorrect,
              },
              create: {
                text: option.text,
                isCorrect: option.isCorrect,
                questionId: questionId,
              },
            });
          })
        );

        await tx.option.deleteMany({
          where: { id: { in: optionsToDelete } },
        });
      }
    });

    res.status(200).json({ message: 'Question updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  const questionId = Number(req.params.id);
  const testId = Number(req.params.testId);

  if (!questionId || !testId) {
    res.status(404).json({ message: 'Ids must be provided' });
    return;
  }

  try {
    await prisma.question.delete({
      where: { id: questionId },
    });

    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
