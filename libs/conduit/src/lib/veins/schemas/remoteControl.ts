import { z } from 'zod';
import { zodLavaName } from '../../names';

export const iWantToKnowAllPlayerViews = {
    loreSchema: z.object({
        name: zodLavaName.or(z.literal('nexus')),
    }),
};

export const iAmAPlayerView = {
    loreSchema: z.object({
        name: zodLavaName.or(z.literal('nexus')),
    }),
};

export const controlPlayerView = {
    loreSchema: z.discriminatedUnion('type', [
        z.object({
            direction: z.enum(['in', 'out']),
            type: z.literal('zoom'),
        }),
        z.object({
            direction: z.enum(['up', 'down', 'left', 'right']),
            type: z.literal('pan'),
        }),
        z.object({
            type: z.literal('reset'),
        }),
    ]),
};

export const iWasControlled = {
    loreSchema: z.object({
        name: zodLavaName.or(z.literal('nexus')),
        rect: z.object({
            height: z.number(),
            width: z.number(),
            x: z.number(),
            y: z.number(),
        }),
    }),
};
