import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import testRouter from './test.routes';
import studentRouter from './student.routes';

const router = Router();

router.use(authRouter);
router.use(testRouter);
router.use(userRouter);
router.use(studentRouter);

export default router;
