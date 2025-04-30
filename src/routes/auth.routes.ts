import { login, logout, register } from '@/controllers/auth.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.post('/auth/login', passport.authenticate('local'), login);

router.post('/auth/logout', authMiddleware, logout);

router.post('/auth/register', register);

export default router;
