import { z } from 'zod';
import { fogOfWarSchema } from '@base';

const messageSchema = z.object({
    data: fogOfWarSchema,
    hash: z.string(),
});

export const fowUpdate = { loreSchema: messageSchema };

export const fowRequest = {
    loreSchema: z.object({ hash: z.string() }),
    responseSchema: messageSchema.partial({ data: true }),
};
