import { Request, Response } from 'express';
import { prisma } from '../server';
import { changeAccountDetailsSchema } from '@/validation/user.dtos';

export const remove = async (req: Request, res: Response): Promise<void> => {
  if (!req.params.id) {
    res.status(400).json({ message: 'User ID is required' });
  }
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    req.logout((err) => {
      if (err) {
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      omit: { password: true },
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOne = async (req: Request, res: Response): Promise<void> => {
  if (!req.params.id) {
    res.status(400).json({ message: 'User ID is required' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      omit: { password: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const profile = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const changeAccountDetails = async (req: Request, res: Response) => {
  const validation = changeAccountDetailsSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
  } else {
    try {
      const userId = (req as any).user.id;
      const { fullName } = validation.data;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { fullName },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
