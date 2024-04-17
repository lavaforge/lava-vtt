import { raw, Router } from 'express';
import { hashBuffer } from 'shared';
import { scg } from 'ioc-service-container';
import { Binary } from 'mongodb';
import { fileTypeFromBuffer } from 'file-type';

const router = Router();

router.get('/:hash', async (req, res) => {
  const db = scg('Db');
  const hash = req.params.hash;

  const image = await db.collection('images').findOne({ hash });

  if (image === null) {
    res.status(404).send('Not found');
    return;
  }

  res
    .set(
      'Content-Type',
      (await fileTypeFromBuffer(image.content.buffer))?.mime ?? 'image/png',
    )
    .send(image.content.buffer);
});

router.post('/', raw({ limit: '15mb' }), async (req, res) => {
  const hash = hashBuffer(req.body);

  const db = scg('Db');

  const binary = new Binary(req.body);

  await db
    .collection('images')
    .updateOne(
      { hash },
      { $setOnInsert: { content: binary, hash } },
      { upsert: true },
    );

  res.send(hash);
});

export { router as imageRouter };
