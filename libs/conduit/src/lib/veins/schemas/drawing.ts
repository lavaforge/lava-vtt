import { z } from 'zod';
import { drawingDataSchema } from '@base';

const messageSchema = z.object({
    data: drawingDataSchema,
    hash: z.string(),
});

export const drawingUpdate = { loreSchema: messageSchema };

export const drawingRequest = {
    loreSchema: z.object({ hash: z.string() }),
    responseSchema: messageSchema.partial({ data: true }),
};
