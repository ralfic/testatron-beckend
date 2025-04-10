import { prisma } from '@/server';
import { comparePassword, hashPassword } from '@/utils/helpers';
import { changePasswordSchema, registerSchema } from '@/validation/auth.dtos';
import { Request, Response } from 'express';

export const register = async (req: Request, res: Response): Promise<void> => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
  } else {
    try {
      const { email, password, fullName } = validation.data;
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          fullName: fullName,
        },
      });
      if (!user) {
        throw new Error('Something went wrong');
      }

      req.login(user, (err: Error | null) => {
        if (err) {
          res
            .status(500)
            .json({ message: 'Internal server error during auto-login' });
          return;
        }

        res.status(201).json(user);
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  req.logout((err) => {
    if (err) {
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Logout successful' });
    }
  });
};

export const changePassword = async (req: Request, res: Response) => {
  const validation = changePasswordSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
  } else {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
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
