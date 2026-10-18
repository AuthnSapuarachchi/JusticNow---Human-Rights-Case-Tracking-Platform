import { io, type Socket } from 'socket.io-client';

import { API_URL, getFreshAccessToken } from './client';

/**
 * One shared, authenticated socket for the whole app (chat + notifications).
 *
 * The `auth` callback runs on every (re)connect, so a reconnect always presents
 * a fresh token instead of the expired one from login. When the server rejects
 * the handshake socket.io stops retrying on its own, so we schedule a retry.
 */
let socket: Socket | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  const instance = io(API_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: (callback) => {
      getFreshAccessToken()
        .then((token) => callback({ token }))
        .catch(() => callback({}));
    },
  });

  instance.on('connect_error', () => {
    // `active` is false when the server refused us (e.g. stale token): retry manually.
    if (!instance.active && !retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (socket === instance) instance.connect();
      }, 3000);
    }
  });

  socket = instance;
  return instance;
}

/** Call on logout so the next user gets their own authenticated connection. */
export function closeSocket() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  socket?.disconnect();
  socket = null;
}
