import { scg } from 'ioc-service-container';
import { Db } from 'mongodb';
import { type FogOfWar, fogOfWarSchema } from '@base';

/**
 * Service for managing fog of war
 */
export class FowService {
    private readonly db: Db = scg('Db');

    /**
     * Set the fog of war for a given hash
     * @param hash The hash of the fog of war
     * @param fow The fog of war
     */
    async setFow(hash: string, fow: FogOfWar) {
        const collection = this.db.collection('fow');
        await collection.updateOne(
            { hash },
            { $set: { fow, hash } },
            { upsert: true },
        );
    }

    /**
     * Get the fog of war for a given hash
     * @param hash The hash of the fog of war
     * @returns The fog of war
     */
    async getFow(hash: string): Promise<FogOfWar | undefined> {
        const collection = this.db.collection('fow');
        const fowDocument = await collection.findOne({ hash });

        const fowData: unknown = fowDocument?.fow;
        const fowParseResult = fogOfWarSchema.safeParse(fowData);

        return fowParseResult.success ? fowParseResult.data : undefined;
    }
}
