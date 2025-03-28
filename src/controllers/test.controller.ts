import { prisma } from '@/server';
import { publishTestSchema, updateTestSchema } from '@/validation/test.dtos';
import { QuestionType } from '@prisma/client';
import { Request, Response } from 'express';
import { customAlphabet } from 'nanoid';

export const createTest = async (req: Request, res: Response) => {
  const authorId = (req as any).user.id;

  if (!authorId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const newTest = await prisma.test.create({
      data: {
        title: 'New Test',
        description: 'Description',
        authorId: authorId,
      },
    });

    res.status(201).json(newTest);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error ' });
  }
};

export const updateTest = async (req: Request, res: Response) => {
  const validation = updateTestSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  try {
    const userId = (req as any).user.id;

    const checkAuthor = await prisma.test.findUnique({
      where: { id: Number(req.params.testId) },
      select: { authorId: true },
    });

    if (checkAuthor?.authorId !== userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { testId } = req.params;

    if (!testId) {
      res.status(400).json({ message: 'Test ID is required' });
      return;
    }

    const updatedTest = await prisma.$transaction(async (tx) => {
      const test = await tx.test.update({
        where: { id: Number(testId) },
        data: {
          title: validation.data.title,
          description: validation.data.description,
          showOptionsScore: validation.data.showOptionsScore,
          showCorrectAnswers: validation.data.showCorrectAnswers,
        },
      });

      if (!test) {
        throw new Error('Something went wrong');
      }

      const existingQuestions = await tx.question.findMany({
        where: { testId: Number(testId) },
        include: { options: true },
      });

      const existingQuestionIds = existingQuestions.map((q) => q.id);
      const newQuestionIds = validation.data.questions?.map((q) => q.id) || [];
      const existingOptionIds = existingQuestions.flatMap((q) =>
        q.options.map((o) => o.id)
      );
      const questionsToDelete = existingQuestionIds.filter(
        (q) => !newQuestionIds.includes(q)
      );
      const optionsToDelete = existingOptionIds.filter(
        (o) =>
          !validation.data.questions?.some((q) =>
            q.options?.some((op) => op.id === o)
          )
      );

      if (validation.data.questions) {
        for (const question of validation.data.questions) {
          const questionId = await tx.question.upsert({
            where: { id: question.id || -1 },
            update: {
              text: question.text,
              type: question.type,
              isRequired: question.isRequired,
              score: question.score,
            },
            create: {
              testId: Number(testId),
              text: question.text ?? 'New Question',
              type: question.type ?? QuestionType.SINGLE,
              isRequired: question.isRequired,
            },
          });

          if (!question.options) {
            continue;
          }

          for (const option of question.options) {
            await tx.option.upsert({
              where: { id: option.id || -1 },
              update: {
                text: option.text,
                isCorrect: option.isCorrect,
              },
              create: {
                questionId: questionId.id,
                text: option.text ?? 'New Option',
              },
            });
          }
        }
      }

      if (questionsToDelete.length > 0) {
        await tx.question.deleteMany({
          where: { id: { in: questionsToDelete } },
        });
      }

      if (optionsToDelete.length > 0) {
        await tx.option.deleteMany({
          where: { id: { in: optionsToDelete } },
        });
      }

      return await tx.test.findUnique({
        where: { id: Number(testId) },
        include: {
          questions: {
            include: {
              options: true,
            },
          },
        },
      });
    });

    res.status(200).json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOneTest = async (req: Request, res: Response) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const checkAuthor = await prisma.test.findUnique({
      where: { id: Number(req.params.testId) },
      select: { authorId: true },
    });

    if (checkAuthor?.authorId !== userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const test = await prisma.test.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    await prisma.test.delete({ where: { id: Number(req.params.id) } });

    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyTests = async (req: Request, res: Response) => {
  const authorId = (req as any).user.id;

  if (!authorId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const tests = await prisma.test.findMany({
      where: { authorId: authorId },
    });
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const publishTest = async (req: Request, res: Response) => {
  const validation = publishTestSchema.safeParse(req.body);

  const testId = Number(req.params.id);

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
        isPublished: true,
        expiresAt: validation.data?.expiresAt,
        code: code,
      },
    });

    res.status(200).json({ message: 'Test published successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

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
