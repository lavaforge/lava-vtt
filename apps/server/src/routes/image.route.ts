import { raw, Router } from 'express';
import { scg } from 'ioc-service-container';
import { ImageController } from '../controllers/image.controller';

const router = Router();

/**
 * GET route for getting an image
 * @param req The request object
 * @param res The response object
 */
router.get('/:hash', async (req, res) => {
    const imageController = scg<ImageController>('ImageController');
    const hash = req.params.hash;
    const image = await imageController.getImage(hash);

    if (image === null) {
        res.status(404).send('Not found');
        return;
    }

    res.set('Content-Type', image.mimeType).send(image.buffer);
});

/**
 * GET route for getting all images
 * @param req The request object
 * @param res The response object
 */
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const imageController = scg<ImageController>('ImageController');
    const images = await imageController.getImages(page, pageSize);
    res.send(images);
});

/**
 * POST route for uploading an image
 * @param req The request object
 * @param res The response object
 */
router.post(
    '/',
    raw({
        limit: '15mb',
        type: [
            'application/octet-stream',
            'image/png',
            'image/jpeg',
            'image/*',
        ],
    }),
    async (req, res) => {
        if (!Buffer.isBuffer(req.body)) {
            return res.status(400).send('Invalid binary data');
        }

        const imageController = scg<ImageController>('ImageController');
        const hash = await imageController.saveImage(req.body);
        res.send(hash);
    },
);

export { router as imageRouter };
