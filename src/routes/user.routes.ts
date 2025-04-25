import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  changeAccountDetails,
  changePassword,
  getProfile,
} from '../controllers/user.controller';

const router = Router();

router.get('/profile', authMiddleware, getProfile);

router.patch('/profile', authMiddleware, changeAccountDetails);

router.put('/user/change-password', authMiddleware, changePassword);

export default router;
