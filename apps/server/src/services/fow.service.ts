import { scg } from 'ioc-service-container';
import { Db } from 'mongodb';

export class FowService {
  private readonly db: Db = scg('Db');

  async setFow(hash: string, fow: number[]) {
    const collection = this.db.collection('fow');
    await collection.updateOne(
      { hash },
      { $set: { hash, fow } },
      { upsert: true },
    );
  }

  async getFow(hash: string): Promise<number[] | null> {
    const collection = this.db.collection('fow');
    const fow = await collection.findOne({ hash });
    return fow?.fow;
  }
}
