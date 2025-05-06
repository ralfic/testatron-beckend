import { Request, Response } from 'express';
import { prisma } from '@/server';

export async function getTestsStatistic(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    res.status(404).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const tests = await prisma.test.findMany({
      where: { authorId: userId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        testSessions: {
          include: {
            answers: {
              include: {
                selectedOptions: true,
              },
            },
            testResult: true,
          },
        },
      },
    });

    if (!tests) {
      res.status(404).json({ message: 'Tests not found' });
      return;
    }

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export async function getTestStatisticById(req: Request, res: Response) {
  const testId = Number(req.params.testId);
  if (isNaN(testId)) {
    res.status(400).json({ message: 'Invalid test ID' });
    return;
  }
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        testSessions: {
          include: {
            answers: {
              include: {
                selectedOptions: true,
              },
            },
            testResult: true,
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
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}
