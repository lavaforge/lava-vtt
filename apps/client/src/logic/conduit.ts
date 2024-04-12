import { Conduit, type Glyph } from 'conduit';
import { io } from 'socket.io-client';

export class FrontendConduit extends Conduit {
  private socket!: ReturnType<typeof io>;
  constructor(private readonly apiUrl: string) {
    super();
    this.initializeConnection();
  }

  protected initializeConnection(): void {
    this.socket = io(this.apiUrl);

    this.socket.on('glyph', (glyph: unknown) => {
      const result = this.newGlyphReceived(glyph);
    });

    this.socket.on('disconnect', () => {
      this._name = undefined;
    });
  }

  protected sendGlyph(glyph: Glyph): Promise<void> {
    this.socket.emit('glyph', glyph);
    return Promise.resolve();
  }
}
