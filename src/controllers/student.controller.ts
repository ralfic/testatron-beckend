import { Request, Response } from 'express';
import { prisma } from '../server';
import { TestSessionStatus } from '@prisma/client';

export async function getPassedTests(req: Request, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const passedTests = await prisma.testSession.findMany({
      where: {
        userId: userId,
        status: TestSessionStatus.FINISHED,
      },
      include: {
        test: true,
      },
    });

    if (!passedTests) {
      res.status(404).json({ message: 'Tests not found' });
      return;
    }

    res.status(200).json(passedTests);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
