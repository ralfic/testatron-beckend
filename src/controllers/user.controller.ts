import { Request, Response } from 'express';
import { prisma } from '../server';
import { changeAccountDetailsSchema } from '@/validation/user.schemas';
import { comparePassword, hashPassword } from '@/utils/helpers';
import { changePasswordSchema } from '@/validation/auth.schemas';

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
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

export const changePassword = async (req: Request, res: Response) => {
  const validation = changePasswordSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
  } else {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const userId = req.user.id;
    try {
      const { currentPassword, newPassword, confirmNewPassword } =
        validation.data;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({ message: 'Something went wrong' });
        return;
      }

      if (newPassword !== confirmNewPassword) {
        res.status(400).json({ message: 'New passwords do not match' });
        return;
      }

      const isValidPassword = await comparePassword(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        res.status(400).json({ message: 'Invalid current password' });
        return;
      }

      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
