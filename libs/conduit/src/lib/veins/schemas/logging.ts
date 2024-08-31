import { z } from 'zod';

const messageSchema = z.object({
    data: z.string(),
});

export const loggingMessage = { loreSchema: messageSchema };
