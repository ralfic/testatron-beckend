import { getPassedTests } from '@/controllers/student.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { Router } from 'express';

const router = Router();

router.get('/student/passed-tests', authMiddleware, getPassedTests);

export default router;
