import { prisma } from '@/server';
import { answersTestSchema, createTestSchema } from '@/validation/test.dtos';
import { Request, Response } from 'express';

export const create = async (req: Request, res: Response) => {
  const validation = createTestSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  const authorId = (req as any).user.id;

  if (!authorId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!validation.data) {
    res.status(400).json({ message: 'Invalid test data' });
    return;
  }

  try {
    const test = await prisma.test.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        authorId: authorId,
        questions: {
          create: validation.data.questions.map((question) => ({
            text: question.text,
            type: question.type,
            isRequired: question.isRequired,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
              })),
            },
          })),
        },
      },
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        questions: {
          include: {
            options: {
              select: {
                text: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        questions: {
          include: {
            options: {
              select: {
                text: true,
              },
            },
          },
        },
      },
    });

    console.log(test);

    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const response = async (req: Request, res: Response) => {
  let score = 0;

  if (!(req as any).user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const validation = answersTestSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
    return;
  }

  if (!validation.data) {
    res.status(400).json({ message: 'Invalid test data' });
    return;
  }

  try {
    console.log(req.params.id);
    const test = await prisma.test.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        questions: {
          include: {
            options: {
              where: { isCorrect: true },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      res.status(404).json({ message: 'Test not found' });
      return;
    }

    for (const answer of validation.data) {
      const question = test.questions.find(
        (question) => question.id === answer.questionId
      );

      switch (question?.type) {
        case 'TEXT':
          break;
        case 'MULTIPLE':
          if (
            question?.options.find((option) => option.id === answer.optionId)
          ) {
            score += 1;
          }
          break;
        case 'SINGLE':
          if (
            question?.options.find((option) => option.id === answer.optionId)
          ) {
            score += 1;
          }
      }
    }

    await prisma.$transaction(async (tx) => {
      const response = await tx.response.create({
        data: {
          userId: (req as any).user.id,
          testId: Number(req.params.id),
          score: score,
        },
      });

      if (!response) {
        res.status(500).json({ message: 'Internal server error' });
      }

      if (!validation.data) {
        res.status(400).json({ message: 'Invalid test data' });
        return;
      }

      for (const answer of validation.data) {
        await tx.answer.create({
          data: {
            responseId: response.id,
            questionId: answer.questionId,
            optionId: answer.optionId,
          },
        });
      }
    });

    res.status(201).json(score);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
