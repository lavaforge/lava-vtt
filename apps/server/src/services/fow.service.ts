import { scg } from 'ioc-service-container';
import { Db } from 'mongodb';
import { type FogOfWar, fogOfWarSchema } from '@base';

export class FowService {
    private readonly db: Db = scg('Db');

    async setFow(hash: string, fow: FogOfWar) {
        const collection = this.db.collection('fow');
        await collection.updateOne(
            { hash },
            { $set: { fow, hash } },
            { upsert: true },
        );
    }

    async getFow(hash: string): Promise<FogOfWar | undefined> {
        const collection = this.db.collection('fow');
        const fowDocument = await collection.findOne({ hash });

        const fowData: unknown = fowDocument?.fow;
        const fowParseResult = fogOfWarSchema.safeParse(fowData);

        return fowParseResult.success ? fowParseResult.data : undefined;
    }
}
