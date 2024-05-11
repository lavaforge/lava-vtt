import { z } from 'zod';

export const drawingDataSchema = z.object({
    canvas: z.object({
        height: z.number(),
        posX: z.number(),
        posY: z.number(),
        width: z.number(),
    }),
    svgPath: z.array(z.string()),
});

export type DrawingData = z.infer<typeof drawingDataSchema>;
