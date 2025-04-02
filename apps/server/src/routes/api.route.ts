import { Router } from 'express';
import { imageRouter } from './image.route';
import { displayRouter } from './display.route';

const router = Router();

router.get('/version', async (req, res) => {
    res.json({ version: 'v1' });
});

export { router as apiRouter };
