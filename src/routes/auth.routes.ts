import { login, logout, register } from '@/controllers/auth.controller';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.post('/auth', passport.authenticate('local'), login);

router.post('/auth/logout', logout);

router.post('/auth/register', register);

export default router;
