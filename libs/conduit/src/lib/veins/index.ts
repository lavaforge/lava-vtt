import { type ZodSchema } from 'zod';
import { imageHash } from './schemas/imageHash';
import { fowUpdate, fowRequest } from './schemas/fow';

/**
 * The available veins to send glyphs through
 */
export const veins = {
    fowRequest,
    fowUpdate,
    imageHash,
} as const satisfies VeinDefinition;

export type Veins = keyof typeof veins;

type VeinDefinition = Record<
    string,
    | { loreSchema: ZodSchema }
    | { loreSchema: ZodSchema; responseSchema: ZodSchema }
>;
