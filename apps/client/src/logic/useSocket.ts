import { io } from 'socket.io-client';
import { onUnmounted } from 'vue';
import { scg } from 'ioc-service-container';

let socket: ReturnType<typeof io> | null = null;

export function useSocket({
  callback,
  event,
  initialize,
}: {
  initialize?: boolean;
  event?: string;
  callback?: (data: any) => void;
}): { emit: ReturnType<typeof io>['emit'] } {
  if (initialize) {
    if (socket) {
      throw new Error('Socket already initialized');
    }

    const apiUrl: string = scg('apiUrl');
    socket = io(apiUrl);
    window.addEventListener('beforeunload', () => {
      socket?.close();
    });
  }

  if (!socket) {
    throw new Error('Socket not initialized');
  }

  if (!event && !callback) {
    return { emit: socket.emit.bind(socket) };
  }

  if (!event || !callback) {
    throw new Error('Missing event or callback');
  }

  socket.on(event, callback);
  onUnmounted(() => {
    socket?.off(event, callback);
  });

  return { emit: socket.emit.bind(socket) };
}
