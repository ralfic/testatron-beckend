import { create, response } from '@/controllers/test.controller';
import { authMiddleware } from '@/middleware/auth.middleware';
import { Router } from 'express';

const router = Router();

router.get('/tests', (req, res) => {});

router.get('/tests:id', (req, res) => {});

router.post('/tests', authMiddleware, create);

router.put('/tests:id', (req, res) => {});

router.delete('/tests:id', (req, res) => {});

router.post('/tests/answers/:id', authMiddleware, response);

export default router;
