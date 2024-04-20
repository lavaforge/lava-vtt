import { Router } from 'express';
import { scg } from 'ioc-service-container';

const displayRouter = Router();

displayRouter.post('/', (req, res) => {
    const conduit = scg('conduit');
    const displayStore = scg('DisplayStore');

    conduit.broadcast('imageHash', req.body as { hash: string });
    displayStore.currentHash = req.body.hash as string;

    res.send('ok');
});

displayRouter.get('/', (req, res) => {
    const displayStore = scg('DisplayStore');

    res.send(displayStore.currentHash ?? '');
});

export { displayRouter };
