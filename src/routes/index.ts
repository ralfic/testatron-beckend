import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import testRouter from './test.routes';

const router = Router();

router.use(authRouter);
router.use(testRouter);
router.use(userRouter);

export default router;
