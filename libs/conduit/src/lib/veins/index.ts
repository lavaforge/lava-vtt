import { type ZodSchema } from 'zod';
import { imageHash } from './schemas/imageHash';
import { fowUpdate, fowRequest } from './schemas/fow';
import { drawingUpdate, drawingRequest } from './schemas/drawing';
import { loggingMessage } from './schemas/logging';
import * as remoteControl from './schemas/remoteControl';

/**
 * The available veins to send glyphs through
 */
export const veins = {
    drawingRequest,
    drawingUpdate,
    fowRequest,
    fowUpdate,
    imageHash,
    loggingMessage,
    ...remoteControl,
} as const satisfies VeinDefinition;

export type Veins = keyof typeof veins;

type VeinDefinition = Record<
    string,
    | { loreSchema: ZodSchema }
    | { loreSchema: ZodSchema; responseSchema: ZodSchema }
>;
