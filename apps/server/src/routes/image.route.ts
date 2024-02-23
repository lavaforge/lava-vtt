import { Router, raw } from 'express';
import { hashBuffer } from 'shared';
import { scg } from 'ioc-service-container';
import { Binary } from 'mongodb';

const router = Router();

router.get('/:hash', async (req, res) => {
  const db = scg('Db');
  const hash = req.params.hash;

  const image = await db.collection('images').findOne({ hash });

  if (image === null) {
    res.status(404).send('Not found');
    return;
  }

  res.set('Content-Type', 'image/png');
  res.send(image.content.buffer);
});

router.post('/', raw({ limit: '15mb' }), async (req, res) => {
  console.log(req, typeof req);
  const hash = hashBuffer(req.body);
  console.log(req.body.length, hash);

  const db = scg('Db');

  const binary = new Binary(req.body);

  const asdf = await db
    .collection('images')
    .updateOne(
      { hash },
      { $setOnInsert: { hash, content: binary } },
      { upsert: true },
    );

  console.log(`Inserted ${asdf.upsertedCount} documents`);

  res.send('ok');
});

export { router as imageRouter };
