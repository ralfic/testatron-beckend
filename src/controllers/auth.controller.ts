import { prisma } from '@/server';
import { hashPassword } from '@/utils/helpers';
import { registerSchema } from '@/validation/auth.dtos';
import { Request, Response } from 'express';

export const register = async (req: Request, res: Response): Promise<void> => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
  } else {
    try {
      const { email, password, firstName, lastName } = validation.data;
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          firstName: firstName,
          lastName: lastName,
        },
      });
      if (!user) {
        throw new Error('Something went wrong');
      }

      res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    res.status(200).json({ message: 'Login successful' });
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

