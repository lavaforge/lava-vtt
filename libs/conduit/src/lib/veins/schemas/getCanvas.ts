import { z } from 'zod';

export const getCanvas = {
  loreSchema: z.object({ size: z.number() }),
  responseSchema: z.object({ canvas: z.string() }),
};
