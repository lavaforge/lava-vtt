import { z } from 'zod';

export const drawingDataSchema = z.array(
    z.object({
        canvas: z.object({
            height: z.number(),
            posX: z.number(),
            posY: z.number(),
            width: z.number(),
        }),
        svgPath: z.string(),
    }),
);

export type DrawingData = z.infer<typeof drawingDataSchema>;
