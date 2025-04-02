import { Router } from 'express';
import { imageRouter } from './image.route';
import { displayRouter } from './display.route';
import { apiRouter } from './api.route';

const router = Router();

router.use('/', apiRouter);

router.use('/image', imageRouter);
router.use('/display', displayRouter);

export default router;
