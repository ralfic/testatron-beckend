import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  changeAccountDetails,
  getAll,
  profile,
} from '../controllers/user.controller';

const router = Router();

router.get('/users', authMiddleware, getAll);

router.get('/users/:id', authMiddleware, getAll);

router.get('/profile', authMiddleware, profile);

router.patch('/profile', authMiddleware, changeAccountDetails);

export default router;
