import {
  createTest,
  updateTest,
  getOneTest,
  deleteTest,
  getMyTests,
  publishTest,
} from '@/controllers/test.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { Router } from 'express';

const router = Router();

router.post('/test', authMiddleware, createTest);

router.put('/test/:testId', authMiddleware, updateTest);

router.get('/test/:id', authMiddleware, getOneTest);

router.delete('/test/:id', authMiddleware, deleteTest);

router.get('/tests/my', authMiddleware, getMyTests);

router.patch('/test/publish/:id', authMiddleware, publishTest);

export default router;
