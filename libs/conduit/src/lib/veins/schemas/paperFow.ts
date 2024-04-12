import { z } from 'zod';

export const paperFow = {
    loreSchema: z.object({
        canvas: z.object({
            height: z.number(),
            posX: z.number(),
            posY: z.number(),
            width: z.number(),
        }),
        svgPath: z.string(),
    }),
};

export type PaperFowLore = z.infer<(typeof paperFow)['loreSchema']>;
