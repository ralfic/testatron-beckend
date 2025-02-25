import { Router } from 'express';
import passport from 'passport';
import { authMiddleware } from '../middleware/auth.middleware';
import { getAll, getProfile } from '../controllers/user.controller';
const router = Router();

router.get('/profile', passport.authenticate('local'), getProfile);

router.get('/users', authMiddleware, getAll);

router.get('/users/:id', authMiddleware, getAll);



export default router;
