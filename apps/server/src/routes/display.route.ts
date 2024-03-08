import { Router } from 'express';
import { scg } from 'ioc-service-container';

const displayRouter = Router();

displayRouter.post('/', (req, res) => {
  const newDisplayedImage = scg('newDisplayedImage');
  newDisplayedImage(req.body.hash);
  res.send('ok');
});

export { displayRouter };
