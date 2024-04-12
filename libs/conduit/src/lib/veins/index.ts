import { type ZodSchema } from 'zod';
import { imageHash } from './schemas/imageHash';
import { requestFow } from './schemas/requestFow';
import { fowUpdate } from './schemas/fowUpdate';

/**
 * The available veins to send glyphs through
 */
export const veins = {
  fowUpdate,
  imageHash,
  requestFow,
} as const satisfies VeinDefinition;

export type Veins = keyof typeof veins;

type VeinDefinition = Record<
  string,
  | { loreSchema: ZodSchema }
  | { loreSchema: ZodSchema; responseSchema: ZodSchema }
>;
