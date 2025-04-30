import { prisma } from '@/server';
import { TestStatus } from '@prisma/client';
import { Request, Response } from 'express';

export const getTestById = async (req: Request, res: Response) => {
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

export const getMyTests = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const testStatus = req.query.status as undefined | string;
  const testSearchTitle = req.query.search as undefined | string;

  const status = testStatus
    ? testStatus === 'expired'
      ? TestStatus.EXPIRED
      : testStatus === 'ongoing'
      ? TestStatus.PUBLISHED
      : null
    : null;

  try {
    const tests = await prisma.test.findMany({
      where: {
        authorId: req.user.id,
        ...(status && { status: status }),
        ...(testSearchTitle && {
          title: {
            contains: testSearchTitle,
            mode: 'insensitive',
          },
        }),
      },
    });
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
