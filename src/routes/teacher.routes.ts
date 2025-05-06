import {
  getTestsStatistic,
  getTestStatisticById,
} from '@/controllers/teacher.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { Router } from 'express';

const router = Router();

router.get('/teacher/test-statistic', authMiddleware, getTestsStatistic);

router.get(
  '/teacher/test-statistic/:testId',
  authMiddleware,
  getTestStatisticById
);

export default router;
