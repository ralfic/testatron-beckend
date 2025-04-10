import { prisma } from '@/server';
import { Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

export const testMiddleware = (checkAuthor = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const testId = Number(req.params.testId);

    // Check if the user is authenticated
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    // Check if the test ID is valid
    if (isNaN(testId)) {
      res.status(400).json({ message: 'Invalid test ID' });
      return;
    }

    // Check if the user is authorized to access the test
    if (checkAuthor && isNaN(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const testExists = await prisma.test.findUnique({
        where: { id: testId },
        select: {
          authorId: true,
        },
      });

      // Check if the test exists
      if (!testExists) {
        res.status(404).json({ message: 'Test not found' });
        return;
      }

      // Check if the user is authorized to access the test
      if (checkAuthor && testExists.authorId !== userId) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        res.status(500).json({ message: 'Something went wrong' });
        return;
      }

      res.status(500).json({ message: 'Internal server error' });
      return;
    }

    return next();
  };
};
