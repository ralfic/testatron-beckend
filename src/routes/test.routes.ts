import {
  createTest,
  getTestById,
  deleteTest,
  getMyTests,
  publishTest,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  updateTestInfo,
} from '@/controllers/test.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { testMiddleware } from '@/middleware/test.middleware';
import { Router } from 'express';

const router = Router();

router.post('/test', authMiddleware, createTest);

router.get('/test/:testId', authMiddleware, testMiddleware(), getTestById);

router.delete('/test/:testId', authMiddleware, testMiddleware(true), deleteTest);

router.get('/tests/my', authMiddleware, getMyTests);

router.patch(
  '/test/publish/:testId',
  authMiddleware,
  testMiddleware(true),
  publishTest
);

router.post(
  '/test/:testId/question',
  authMiddleware,
  testMiddleware(true),
  createQuestion
);

router.delete(
  '/test/:testId/question/:id',
  authMiddleware,
  testMiddleware(true),
  deleteQuestion
);

router.patch(
  '/test/:testId/question/:id',
  authMiddleware,
  testMiddleware(true),
  updateQuestion
);

router.patch('/test/:testId', authMiddleware, testMiddleware(true), updateTestInfo);

export default router;
