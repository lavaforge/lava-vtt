import { z } from 'zod';
import { type LavaName } from './names';
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
  hello: { loreSchema: z.object({ name: z.string() }) },
  paint: { loreSchema: paintSchema },
  ping: {
    loreSchema: z.object({ msg: z.string() }),
    responseSchema: z.object({ msg: z.string() }),
  },
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

export type Glyph = z.infer<typeof zodGlyph>;

export abstract class Conduit {
  protected _name: 'nexus' | LavaName | undefined = undefined;
  protected static readonly RESPONSE_TIMEOUT = 10000;

  get name(): 'nexus' | LavaName {
    if (this._name === undefined) {
      throw new Error('Conduit is not initialized yet');
    }

    return this._name;
  }

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

    this.ensureInitialization();
    const glyph: Glyph = {
      from: this._name,
      lore,
      msgNum: uniqueId(`${this._name}_${vein}`),
      target: 'broadcast',
      vein,
    };

    return this.sendGlyph(glyph).then(() => undefined as R);
  }

  protected responseHandlers = new Set<(glyph: Glyph) => boolean>();

  invoke<Vein extends Veins>(
    vein: Vein,
    target: 'nexus' | LavaName,
    lore: LoreSchema<Vein>,
  ): Promise<
    (typeof veins)[Vein] extends HasResponse ? ResponseSchema<Vein> : void
  > {
    const veinDefinition = veins[vein];
    const loreSchema = veinDefinition.loreSchema;
    if (!loreSchema.safeParse(lore).success) {
      // TODO: output actual zod error
      return Promise.reject(new Error('Invalid lore'));
    }

    this.ensureInitialization();
    const glyph: Glyph = {
      from: this._name,
      lore,
      msgNum: uniqueId(`${this._name}_${vein}`),
      target,
      vein,
    };

    if (!('responseSchema' in veinDefinition)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return this.sendGlyph(glyph).then(() => undefined as any);
    }

    let responseHandler: (glyph: Glyph) => boolean;
    const responseLore = new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(responseHandler);
        reject(new Error('Response timeout'));
      }, Conduit.RESPONSE_TIMEOUT);

      responseHandler = (response: Glyph) => {
        if (
          response.vein == `RESPONSE:${glyph.vein}` &&
          response.msgNum === glyph.msgNum
        ) {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return responseLore.then((lore) => responseSchema.parse(lore) as any);
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
        this.ensureInitialization();
        const responseGlyph: Glyph = {
          from: this._name,
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

  protected newGlyphReceived(
    glyph: unknown,
  ):
    | { status: 'forward'; to: LavaName | 'nexus' }
    | { status: 'done' }
    | { status: 'broadcast' } {
    console.log('newGlyphReceived', glyph);

    if (this._name === undefined) {
      const parsed = helloMsg.safeParse(glyph);
      if (parsed.success) {
        this._name = parsed.data.name;
        console.log('Conduit initialized with name', this._name);
      } else {
        console.warn(
          'Conduit is not initialized yet, cannot receive glyphs...',
        );
      }
      return { status: 'done' };
    }

    // TODO: error "invalid glyph format"
    const parsedGlyph = zodGlyph.parse(glyph);

    if (
      parsedGlyph.target !== 'broadcast' &&
      parsedGlyph.target !== this._name
    ) {
      return { status: 'forward', to: parsedGlyph.target };
    }

    if (parsedGlyph.target === 'broadcast') {
      // TODO: error "unsupported vein"
      const vein = zodVeins.parse(parsedGlyph.vein);
      const handlers = this.veinHandlers.get(vein);
      handlers?.forEach((handler) => handler(parsedGlyph));

      return { status: 'broadcast' };
    }

    if (parsedGlyph.vein.startsWith('RESPONSE:')) {
      for (const handler of this.responseHandlers) {
        if (handler(parsedGlyph)) {
          return { status: 'done' };
        }
      }
      console.warn('Received a response glyph without a handler');
      return { status: 'done' };
    }

    // TODO: error "unsupported vein"
    const vein = zodVeins.parse(parsedGlyph.vein);
    const handlers = this.veinHandlers.get(vein);
    handlers?.forEach((handler) => handler(parsedGlyph));

    return { status: 'done' };
  }

  protected ensureInitialization(): asserts this is {
    _name: 'nexus' | LavaName;
  } {
    if (this._name === undefined) {
      throw new Error('Conduit is not initialized yet');
    }
  }
}
