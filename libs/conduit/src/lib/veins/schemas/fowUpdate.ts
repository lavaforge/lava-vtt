import { z } from 'zod';

export const fowUpdate = {
    loreSchema: z.object({ fow: z.array(z.number()), hash: z.string() }),
};
