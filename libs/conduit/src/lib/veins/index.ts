import { type ZodSchema } from 'zod';
import { hello } from './schemas/hello';
import { ping } from './schemas/ping';
import { paint } from './schemas/paint';
import { getCanvas } from './schemas/getCanvas';

export const veins = {
  getCanvas,
  hello,
  paint,
  ping,
} as const satisfies VeinDefinition;

export type Veins = keyof typeof veins;

type VeinDefinition = Record<
  string,
  | { loreSchema: ZodSchema }
  | { loreSchema: ZodSchema; responseSchema: ZodSchema }
>;
