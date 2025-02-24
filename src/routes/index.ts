import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './user.routes';

const router = Router();

router.use(authRouter);
router.use(userRouter);

export default router;
