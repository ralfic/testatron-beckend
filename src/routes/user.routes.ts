import { Router } from 'express';

const router = Router();

router.get('/api/user', (req, res) => {
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

export default router;