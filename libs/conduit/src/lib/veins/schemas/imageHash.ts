import { z } from 'zod';

export const imageHash = {
  loreSchema: z.object({ hash: z.string() }),
};
