import { scg } from 'ioc-service-container';
import { Db } from 'mongodb';
import { type DrawingData, drawingDataSchema } from '@base';

export class DrawingService {
    private readonly db: Db = scg('Db');

    async setDrawing(hash: string, drawing: DrawingData) {
        const collection = this.db.collection('drawing');
        await collection.updateOne(
            { hash },
            { $set: { drawing, hash } },
            { upsert: true },
        );
    }

    async getDrawing(hash: string): Promise<DrawingData | undefined> {
        const collection = this.db.collection('drawing');
        const drawingDocument = await collection.findOne({ hash });

        const drawingData: unknown = drawingDocument?.drawing;
        const drawingParseResult = drawingDataSchema.safeParse(drawingData);

        return drawingParseResult.success ? drawingParseResult.data : undefined;
    }
}
