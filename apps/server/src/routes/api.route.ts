import { Router } from 'express';
import { imageRouter } from './image.route';

const router = Router();

router.get('/version', async (req, res) => {
  res.json({ version: 'v1' });
});

router.use('/image', imageRouter);

export { router as apiRouter };
