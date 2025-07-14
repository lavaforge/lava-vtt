import { scg } from 'ioc-service-container';
import { Db } from 'mongodb';
import { type DrawingData, drawingDataSchema } from '@base';

/**
 * Service for managing drawings
 */
export class DrawingService {
    private readonly db: Db = scg('Db');

    /**
     * Set a drawing in the database
     * @param hash The hash of the drawing
     * @param drawing The drawing data
     */
    async setDrawing(hash: string, drawing: DrawingData) {
        const collection = this.db.collection('drawing');
        await collection.updateOne(
            { hash },
            { $set: { drawing, hash } },
            { upsert: true },
        );
    }

    /**
     * Get a drawing from the database
     * @param hash The hash of the drawing
     * @returns The drawing data
     */
    async getDrawing(hash: string): Promise<DrawingData | undefined> {
        const collection = this.db.collection('drawing');
        const drawingDocument = await collection.findOne({ hash });

        const drawingData: unknown = drawingDocument?.drawing;
        const drawingParseResult = drawingDataSchema.safeParse(drawingData);

        return drawingParseResult.success ? drawingParseResult.data : undefined;
    }
}
