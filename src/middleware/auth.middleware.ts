import { Request, Response, NextFunction } from 'express';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
    return 
  }
};
