import { z } from 'zod';
import { LavaName } from '../lib/names';
import { uniqueId } from 'lodash-es';

const paintSchema = z.object({
  loc: z.object({
    x: z.number(),
    y: z.number(),
  }),
  type: z.string(),
});

const veins = {
  getCanvas: {
    loreSchema: z.object({ size: z.number() }),
    responseSchema: z.object({ canvas: z.string() }),
  },
  paint: { loreSchema: paintSchema },
} as const satisfies Record<
  string,
  | { loreSchema: z.ZodSchema }
  | { loreSchema: z.ZodSchema; responseSchema: z.ZodSchema }
>;

type Veins = keyof typeof veins;

type HasResponse = { responseSchema: z.ZodSchema };
type LoreSchema<V extends Veins> = z.infer<(typeof veins)[V]['loreSchema']>;
type ResponseSchema<V extends Veins> = (typeof veins)[V] extends HasResponse
  ? z.infer<(typeof veins)[V]['responseSchema']>
  : never;

const zodLavaName = z.custom<LavaName>(
  (val) => typeof val === 'string' && /^[a-z]+-[a-z]+-[a-z]+$/.test(val),
);
const zodVeins = z.custom<Veins>(
  (val) => typeof val === 'string' && val in veins,
);

const zodGlyph = z.object({
  from: z.literal('nexus').or(zodLavaName),
  lore: z.unknown(),
  msgNum: z.string(),
  target: z.union([z.literal('broadcast'), z.literal('nexus'), zodLavaName]),
  vein: z.string(),
});

const helloMsg = z.object({ name: zodLavaName });

type Glyph = z.infer<typeof zodGlyph>;

abstract class Conduit {
  protected name!: 'nexus' | LavaName;
  protected static readonly RESPONSE_TIMEOUT = 10000;

  dispatch<
    Vein extends Veins,
    R = (typeof veins)[Vein] extends HasResponse ? never : void,
  >(vein: Vein, lore: LoreSchema<Vein>): Promise<R> {
    if ('responseSchema' in veins[vein]) {
      throw new Error(
        `Cannot broadcast to a vein (${vein}) which expects a response!`,
      );
    }

    const loreSchema = veins[vein].loreSchema;
    if (!loreSchema.safeParse(lore).success) {
      // TODO: output actual zod error
      return Promise.reject(new Error('Invalid lore'));
    }

    const glyph: Glyph = {
      from: this.name,
      lore,
      msgNum: uniqueId(`${this.name}_${vein}`),
      target: 'broadcast',
      vein,
    };

    return this.sendGlyph(glyph).then(() => undefined as R);
  }

  protected responseHandlers = new Set<(glyph: Glyph) => boolean>();

  invoke<
    Vein extends Veins,
    R = (typeof veins)[Vein] extends HasResponse ? ResponseSchema<Vein> : void,
  >(
    vein: Vein,
    target: 'nexus' | LavaName,
    lore: LoreSchema<Vein>,
  ): Promise<R> {
    const veinDefinition = veins[vein];
    const loreSchema = veinDefinition.loreSchema;
    if (!loreSchema.safeParse(lore).success) {
      // TODO: output actual zod error
      return Promise.reject(new Error('Invalid lore'));
    }

    const glyph: Glyph = {
      from: this.name,
      lore,
      msgNum: uniqueId(`${this.name}_${vein}`),
      target,
      vein,
    };

    if (!('responseSchema' in veinDefinition)) {
      return this.sendGlyph(glyph).then(() => undefined as R);
    }

    let responseHandler: (glyph: Glyph) => boolean;
    const responseLore = new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(responseHandler);
        reject(new Error('Response timeout'));
      }, Conduit.RESPONSE_TIMEOUT);

      responseHandler = (response: Glyph) => {
        if (response.vein == glyph.vein && response.msgNum === glyph.msgNum) {
          clearTimeout(timeout);
          this.responseHandlers.delete(responseHandler);
          resolve(response.lore);
          return true;
        }
        return false;
      };

      this.responseHandlers.add(responseHandler);
    });

    this.sendGlyph(glyph).catch((err) => {
      this.responseHandlers.delete(responseHandler);
      throw err;
    });

    const responseSchema = veinDefinition.responseSchema;
    return responseLore.then((lore) => responseSchema.parse(lore) as R);
  }

  protected veinHandlers = new Map<
    Veins,
    Set<(glyph: Glyph) => Promise<void>>
  >();

  attune<Vein extends Veins>(
    vein: Vein,
    callback: (typeof veins)[Vein] extends HasResponse
      ? (
          lore: LoreSchema<Vein>,
          respond: (lore: ResponseSchema<Vein>) => Promise<void>,
        ) => Promise<void> | void
      : (lore: LoreSchema<Vein>) => Promise<void> | void,
  ): { detune: () => void } {
    if (!this.veinHandlers.has(vein)) {
      this.veinHandlers.set(vein, new Set());
    }

    const veinDefinition = veins[vein];

    if (!('responseSchema' in veinDefinition)) {
      const handler = async (glyph: Glyph) => {
        const lore = veinDefinition.loreSchema.parse(glyph.lore);
        await callback(lore, () => Promise.resolve());
      };
      this.veinHandlers.get(vein)?.add(handler);
      return { detune: () => this.veinHandlers.get(vein)?.delete(handler) };
    }

    const responseSchema = veinDefinition.responseSchema;

    const handler = async (glyph: Glyph) => {
      const lore = veinDefinition.loreSchema.parse(glyph.lore);
      await callback(lore, (responseLore) => {
        const responseGlyph: Glyph = {
          from: this.name,
          lore: responseSchema.parse(responseLore),
          msgNum: glyph.msgNum,
          target: glyph.from,
          vein: `RESPONSE:${glyph.vein}`,
        };
        return this.sendGlyph(responseGlyph);
      });
    };
    this.veinHandlers.get(vein)?.add(handler);
    return { detune: () => this.veinHandlers.get(vein)?.delete(handler) };
  }

  protected abstract sendGlyph(glyph: Glyph): Promise<void>;
  protected abstract initializeConnection(): void;

  protected newGlyphReceived(glyph: unknown): void {
    if (this.name === undefined) {
      const parsed = helloMsg.safeParse(glyph);
      if (parsed.success) {
        this.name = parsed.data.name;
      } else {
        console.warn(
          'Conduit is not initialized yet, cannot receive glyphs...',
        );
      }
    }

    // TODO: error "invalid glyph format"
    const parsedGlyph = zodGlyph.parse(glyph);

    if (parsedGlyph.vein.startsWith('RESPONSE:')) {
      for (const handler of this.responseHandlers) {
        if (handler(parsedGlyph)) {
          return;
        }
      }
      console.warn('Received a response glyph without a handler');
      return;
    }

    // TODO: error "unsupported vein"
    const vein = zodVeins.parse(parsedGlyph.vein);

    const handlers = this.veinHandlers.get(vein);
    handlers?.forEach((handler) => handler(parsedGlyph));
  }
}

class BackendConduit extends Conduit {
  protected sendGlyph(glyph: Glyph): Promise<void> {
    return Promise.resolve();
  }
}
class FrontendConduit extends Conduit {
  protected sendGlyph(glyph: Glyph): Promise<void> {
    return Promise.resolve();
  }
}

const conduit = new BackendConduit();

conduit.invoke('paint', 'nexus', {});
void (async () => {
  const x = await conduit.dispatch('getCanvas', { size: 42 });
  console.log(x);
})();

conduit.invoke('getCanvas', 'nexus', {});
conduit.attune('paint', (lore) => {});
conduit.attune('getCanvas', (lore, respond) => {
  respond({ canvas: 'asdfasdf' });
});
