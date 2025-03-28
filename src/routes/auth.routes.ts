import {
  changePassword,
  login,
  logout,
  register,
} from '@/controllers/auth.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.post('/auth', passport.authenticate('local'), login);

router.post('/auth/logout', authMiddleware, logout);

router.post('/auth/register', register);

router.put('/auth/change-password', authMiddleware, changePassword);

export default router;
