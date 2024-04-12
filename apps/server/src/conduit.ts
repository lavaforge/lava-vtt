import {
  Conduit,
  Glyph,
  LavaName,
  uniqueLavaName,
  unregisterName,
} from 'conduit';
import { Server, Socket } from 'socket.io';
import { scg } from 'ioc-service-container';

export class BackendConduit extends Conduit {
  private readonly connections = new Map<LavaName, Socket>();
  constructor(private readonly io: Server) {
    super();
    this._name = 'nexus';
    this.initializeConnection();
  }

  protected sendGlyph(glyph: Glyph): Promise<void> {
    const target = glyph.target;

    if (target === 'broadcast') {
      this.io.emit('glyph', glyph);
    } else if (target !== 'nexus') {
      const newVar = this.connections.get(target);
      if (newVar === undefined) {
        throw new Error('No connection found for target');
      }
      newVar.emit('glyph', glyph);
    } else {
      throw new Error('Cannot send from nexus to nexus');
    }

    return Promise.resolve();
  }

  protected initializeConnection(): void {
    this.io.on('connection', (socket) => {
      const name = uniqueLavaName();
      console.log('new connection', name);

      this.connections.set(name, socket);
      socket.emit('glyph', { name });

      setTimeout(() => {
        const displayStore = scg('DisplayStore');

        const hash = displayStore.currentHash ?? '';
        void this.invoke('imageHash', name, { hash });
      });

      socket.on('disconnect', () => {
        this.connections.delete(name);
        unregisterName(name);
        console.log('disconnected', name);
      });

      socket.on('glyph', (glyph: unknown) => {
        const result = this.newGlyphReceived(glyph);

        if (result.status === 'forward' && result.to !== 'nexus') {
          this.connections.get(result.to)?.emit('glyph', glyph);
        } else if (result.status === 'broadcast') {
          socket.broadcast.emit('glyph', glyph);
        }
      });
    });
  }
}
