import { z } from 'zod';

export const ping = {
  loreSchema: z.object({ msg: z.string() }),
  responseSchema: z.object({ msg: z.string() }),
};
