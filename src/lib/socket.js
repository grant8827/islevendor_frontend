import { io } from 'socket.io-client';
import { API_BASE, getToken } from '../api/client.js';

// Single shared socket.io connection for dispatch's live events (driver job
// offers, warehouse/shop delivery notifications — see backend-node's
// dispatch.gateway.ts). Same origin-handling as apiRequest/uploadImage in
// api/client.js: empty API_BASE in dev (proxied by vite.config.js's
// '/socket.io' entry), the backend's own domain in production.
let socket = null;

/**
 * Returns the shared socket, connecting (or reconnecting with a fresh auth
 * token) if needed. Returns null if there's no logged-in user to connect
 * as — callers should treat that as "no live updates this session" rather
 * than an error.
 */
export function getSocket() {
  const token = getToken();
  if (!token) return null;

  if (!socket) {
    const opts = { auth: { token }, transports: ['websocket', 'polling'] };
    socket = API_BASE ? io(API_BASE, opts) : io(opts);
    return socket;
  }

  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

// Call on logout / dashboard unmount so a stale-token connection doesn't
// linger — a fresh getSocket() call afterward reconnects with whatever
// token is current at that point.
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
