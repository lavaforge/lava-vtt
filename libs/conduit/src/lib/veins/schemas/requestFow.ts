import { z } from 'zod';

export const requestFow = {
    loreSchema: z.object({ hash: z.string() }),
    responseSchema: z.object({
        fow: z.array(z.number()).or(z.null()),
        hash: z.string(),
    }),
};
