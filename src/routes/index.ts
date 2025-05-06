import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import testRouter from './test.routes';
import studentRouter from './student.routes';
import teacherRouter from './teacher.routes';

const router = Router();

router.use(authRouter);
router.use(testRouter);
router.use(userRouter);
router.use(studentRouter);
router.use(teacherRouter);

export default router;
