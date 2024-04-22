import { z } from 'zod';

export const fogOfWarSchema = z.object({
    canvas: z.object({
        height: z.number(),
        posX: z.number(),
        posY: z.number(),
        width: z.number(),
    }),
    svgPath: z.string(),
});

export type FogOfWar = z.infer<typeof fogOfWarSchema>;
