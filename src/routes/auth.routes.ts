import {
  loginUser,
  logoutUser,
  registerUser,
} from '@/controllers/auth.controller';
import { Router } from 'express';
import passport from 'passport';

const router = Router();

router.post('/api/auth', passport.authenticate('local'), loginUser);

router.post('/api/auth/logout', logoutUser);

router.post('/api/auth/register', registerUser);

export default router;
