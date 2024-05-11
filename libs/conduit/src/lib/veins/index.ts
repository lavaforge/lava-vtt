import { type ZodSchema } from 'zod';
import { imageHash } from './schemas/imageHash';
import { fowUpdate, fowRequest } from './schemas/fow';
import { drawingUpdate, drawingRequest } from './schemas/drawing';

/**
 * The available veins to send glyphs through
 */
export const veins = {
    fowRequest,
    fowUpdate,
    imageHash,
    drawingUpdate,
    drawingRequest,
} as const satisfies VeinDefinition;

export type Veins = keyof typeof veins;

type VeinDefinition = Record<
    string,
    | { loreSchema: ZodSchema }
    | { loreSchema: ZodSchema; responseSchema: ZodSchema }
>;
