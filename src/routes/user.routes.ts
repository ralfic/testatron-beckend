import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getAll, profile } from '../controllers/user.controller';

const router = Router();

router.get('/users', authMiddleware, getAll);

router.get('/users/:id', authMiddleware, getAll);

router.get('/profile', authMiddleware, profile);

export default router;
