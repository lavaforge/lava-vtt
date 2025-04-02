import { Router } from 'express';
import { scg } from 'ioc-service-container';

const displayRouter = Router();

/**
 * POST route for setting the current hash
 * @param req The request object
 * @param res The response object
 */
displayRouter.post('/', (req, res) => {
    const conduit = scg('conduit');
    const displayStore = scg('DisplayStore');

    conduit.broadcast('imageHash', req.body as { hash: string });
    displayStore.currentHash = req.body.hash as string;

    res.send('ok');
});

/**
 * GET route for getting the current hash
 * @param req The request object
 * @param res The response object
 */
displayRouter.get('/', (req, res) => {
    const displayStore = scg('DisplayStore');

    res.send(displayStore.currentHash ?? '');
});

export { displayRouter };
