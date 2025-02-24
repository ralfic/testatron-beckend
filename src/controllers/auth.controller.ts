import { register } from '@/services/auth.service';
import { registerSchema } from '@/validation/auth.dtos';
import { Request, Response } from 'express';

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.error.errors });
  } else {
    try {
      const user = await register(validation.data);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const logoutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  req.logout((err) => {
    if (err) {
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Logout successful' });
    }
  });
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json(req.user);
};
