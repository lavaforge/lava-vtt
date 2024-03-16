import { z } from 'zod';

export const hello = { loreSchema: z.object({ name: z.string() }) };
