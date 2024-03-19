import { z } from 'zod';
import { veins, type Veins } from './veins';
import { zodLavaName } from './names';

/**
 * Structural type that can be used if vein has a response schema
 */
export type HasResponse = { responseSchema: z.ZodSchema };

/**
 * The type of the lore schema for a given vein
 */
export type LoreSchema<V extends Veins> = z.infer<
  (typeof veins)[V]['loreSchema']
>;

/**
 * The type of the response schema for a given vein
 */
export type ResponseSchema<V extends Veins> =
  (typeof veins)[V] extends HasResponse
    ? z.infer<(typeof veins)[V]['responseSchema']>
    : never;

/**
 * Zod schema for the names of veins
 */
export const zodVeins = z.custom<Veins>(
  (val) => typeof val === 'string' && val in veins,
);

/**
 * Zod schema for a generic glyph that gets sent via the conduit
 */
export const zodGlyph = z.object({
  from: z.literal('nexus').or(zodLavaName),
  lore: z.unknown(),
  msgNum: z.string(),
  target: z.union([z.literal('broadcast'), z.literal('nexus'), zodLavaName]),
  vein: z.string(),
});

/**
 * The type of a generic glyph that gets sent via the conduit
 */
export type Glyph = z.infer<typeof zodGlyph>;

/**
 * Zod schema for the first conduit message that gets sent for exchanging the name
 */
export const zodNameExchange = z.object({ name: zodLavaName });
