import { Router } from 'express';
import { imageRouter } from './image.route';
import { displayRouter } from './display.route';

const router = Router();

router.get('/version', async (req, res) => {
  res.json({ version: 'v1' });
});

router.use('/image', imageRouter);
router.use('/display', displayRouter);

export { router as apiRouter };
