import { type LavaName } from './names';
import { uniqueId } from 'lodash-es';
import { veins, type Veins } from './veins';
import {
    type Glyph,
    type HasResponse,
    type LoreSchema,
    type ResponseSchema,
    zodGlyph,
    zodNameExchange,
    zodVeins,
} from './types';
import { fromZodError } from 'zod-validation-error';

export abstract class Conduit {
    /**
     * Delay after which a response is considered timed out
     */
    protected static readonly RESPONSE_TIMEOUT = 5000;

    /**
     * Handlers that are currently waiting for a response
     */
    protected responseHandlers = new Set<(glyph: Glyph) => boolean>();

    /**
     * Handlers that were attuned to a vein
     */
    protected veinHandlers = new Map<
        Veins,
        Set<(glyph: Glyph) => Promise<void>>
    >();

    private initializationPromises: Array<() => void> = [];

    /**
     * The name by which this client of the conduit is known
     *
     * The special name 'nexus' is reserved for the backend of lava
     */
    protected _name: 'nexus' | LavaName | undefined = undefined;

    /**
     * The name by which this client of the conduit is known
     */
    get name(): 'nexus' | LavaName {
        if (this._name === undefined) {
            throw new Error('Conduit is not initialized yet');
        }

        return this._name;
    }

    async initializationFinished(): Promise<void> {
        if (this._name === undefined) {
            return new Promise((resolve) =>
                this.initializationPromises.push(resolve),
            );
        }
        return Promise.resolve();
    }

    /**
     * Send a glyph via the conduit
     */
    protected abstract sendGlyph(glyph: Glyph): Promise<void>;

    /**
     * Initialize the conduit
     */
    protected abstract initializeConnection(): void;

    /**
     * Broadcast a glyph to all participants
     */
    async broadcast<Vein extends Veins>(
        vein: Vein,
        lore: LoreSchema<Vein>,
    ): Promise<(typeof veins)[Vein] extends HasResponse ? never : void> {
        if ('responseSchema' in veins[vein]) {
            throw new Error(
                `Cannot broadcast to a vein (${vein}) which expects a response!`,
            );
        }

        const parseResult = veins[vein].loreSchema.safeParse(lore);
        if (!parseResult.success) {
            throw fromZodError(parseResult.error);
        }

        await this.sendGlyph(this.createGlyph(vein, lore, 'broadcast'));

        // needed because typescript can't infer whether to use never or void
        return undefined as never;
    }

    async invoke<Vein extends Veins>(
        vein: Vein,
        target: 'nexus' | LavaName,
        lore: LoreSchema<Vein>,
    ): Promise<
        (typeof veins)[Vein] extends HasResponse ? ResponseSchema<Vein> : void
    > {
        const veinDefinition = veins[vein];

        const parseResult = veinDefinition.loreSchema.safeParse(lore);
        if (!parseResult.success) {
            throw fromZodError(parseResult.error);
        }

        const glyph = this.createGlyph(vein, lore, target);

        if (!('responseSchema' in veinDefinition)) {
            await this.sendGlyph(glyph);

            // needed because typescript can't infer if the return type is response or void
            return undefined as never;
        }

        const { unregisterHandler, promise: responsePromise } =
            this.initResponseHandler(glyph);

        const responseSchema = veinDefinition.responseSchema;
        try {
            await this.sendGlyph(glyph);
            return responseSchema.parse(await responsePromise) as never;
        } finally {
            unregisterHandler();
        }
    }

    attune<Vein extends Veins>(
        vein: Vein,
        callback: (typeof veins)[Vein] extends HasResponse
            ? (
                  lore: LoreSchema<Vein>,
                  respond: (lore: ResponseSchema<Vein>) => Promise<void>,
              ) => Promise<void> | void
            : (lore: LoreSchema<Vein>) => Promise<void> | void,
    ): {
        detune: () => void;
    } {
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
            return {
                detune: () => this.veinHandlers.get(vein)?.delete(handler),
            };
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

    protected createGlyph<Vein extends Veins>(
        vein: Vein,
        lore: unknown,
        target: LavaName | 'nexus' | 'broadcast',
    ): Glyph {
        this.ensureInitialization();
        return {
            from: this._name,
            lore,
            msgNum: uniqueId(`${this._name}_${vein}`),
            target,
            vein,
        };
    }

    protected initResponseHandler(glyph: Glyph): {
        promise: Promise<unknown>;
        unregisterHandler: () => void;
    } {
        let responseHandler: (glyph: Glyph) => boolean;

        const promise = new Promise<unknown>((resolve, reject) => {
            const responseTimeout = setTimeout(() => {
                this.responseHandlers.delete(responseHandler);
                reject(new Error(`Response timeout: ${glyph.vein}`));
            }, Conduit.RESPONSE_TIMEOUT);

            responseHandler = (response: Glyph) => {
                const isCorrectResponse =
                    response.vein == `RESPONSE:${glyph.vein}` &&
                    response.msgNum === glyph.msgNum;

                if (isCorrectResponse) {
                    clearTimeout(responseTimeout);

                    this.responseHandlers.delete(responseHandler);
                    resolve(response.lore);

                    return true;
                }
                return false;
            };

            this.responseHandlers.add(responseHandler);
        });

        return {
            promise,
            unregisterHandler: () =>
                this.responseHandlers.delete(responseHandler),
        };
    }

    /**
     * This method must be called in the implementation of initializeConnection
     *
     * It handles:
     * - initially setting the name of the conduit
     * - checking whether a glyph needs to be forwarded
     * - calling the appropriate handlers for a received glyph
     */
    protected newGlyphReceived(glyph: unknown):
        | { status: 'forward'; to: LavaName | 'nexus' }
        | { status: 'done' }
        | {
              status: 'broadcast';
          } {
        if (this._name === undefined) {
            const parsed = zodNameExchange.safeParse(glyph);
            if (parsed.success) {
                this._name = parsed.data.name;
                this.initializationPromises.forEach((resolve) => resolve());
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
            console.warn(
                `Received a response glyph without a handler: ${glyph}`,
            );
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
