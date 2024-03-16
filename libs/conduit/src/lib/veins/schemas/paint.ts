import { z } from 'zod';

export const paint = {
  loreSchema: z.object({
    loc: z.object({
      x: z.number(),
      y: z.number(),
    }),
    type: z.string(),
  }),
};
