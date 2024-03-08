import { Router } from 'express';
import { scg } from 'ioc-service-container';

const fowRouter = Router();

fowRouter.get('/:hash', (req, res) => {
  const fowService = scg('FowService');

  const hash = req.params.hash;

  fowService.getFow(hash).then((fow) => {
    if (fow === null) {
      res.status(404).send('Not found');
      return;
    }

    res.json(fow);
  });
});

export { fowRouter };
