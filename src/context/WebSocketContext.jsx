import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

/**
 * Provides a single, shared WebSocket connection for the entire app.
 *
 * Features:
 * - Token sent as first WS message (not in URL) — prevents log exposure
 * - Automatic reconnect with exponential backoff (1s, 2s, 4s … up to 30s)
 * - Clean close on logout (code 1000) — no reconnect loop after logout
 * - Publisher/subscriber pattern: subscribe(type, handler) → returns unsubscribe fn
 *
 * Backend requirement: Django Channels consumer must support:
 *   { "type": "auth", "token": "<access_token>" }
 * as the first message before processing any events.
 *
 * Local dev fallback: set VITE_WS_LEGACY_TOKEN_URL=true in .env.local to send
 * the token as a URL query param (insecure, only for backends not yet updated).
 */
export function WebSocketProvider({ children }) {
  const { isAuth } = useAuth();

  // Keep isAuth available inside the stable connect callback closure
  const isAuthRef = useRef(isAuth);
  isAuthRef.current = isAuth;

  const ws = useRef(null);
  const listeners = useRef({}); // { messageType: Set<handler> }
  const retries = useRef(0);
  const reconnectTimeout = useRef(null);

  const subscribe = useCallback((type, handler) => {
    if (!listeners.current[type]) {
      listeners.current[type] = new Set();
    }
    listeners.current[type].add(handler);
    return () => listeners.current[type]?.delete(handler);
  }, []);

  const connect = useCallback(() => {
    // Guard: don't open if not authenticated or already open
    if (!isAuthRef.current) return;
    if (ws.current?.readyState === WebSocket.OPEN) return;
    if (ws.current?.readyState === WebSocket.CONNECTING) return;

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;

    const wsHost = import.meta.env.VITE_WS_HOST ?? 'localhost:8000';
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const useLegacyToken = import.meta.env.VITE_WS_LEGACY_TOKEN_URL === 'true';

    const wsUrl = useLegacyToken
      ? `${protocol}://${wsHost}/ws/tracking/?token=${accessToken}`
      : `${protocol}://${wsHost}/ws/tracking/`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      retries.current = 0; // reset backoff on successful connect
      if (!useLegacyToken) {
        ws.current.send(JSON.stringify({ type: 'auth', token: accessToken }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = listeners.current[data.type];
        if (handlers) handlers.forEach((h) => h(data));
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.current.onerror = (err) => console.error('WebSocket error:', err);

    ws.current.onclose = (event) => {
      // code 1000 = clean close (logout / unmount) — do NOT reconnect
      if (event.code === 1000 || !isAuthRef.current) return;

      const delay = Math.min(1000 * 2 ** retries.current, 30000);
      retries.current += 1;
      console.info(`WebSocket closed (code ${event.code}). Reconnecting in ${delay}ms (attempt ${retries.current})…`);
      reconnectTimeout.current = setTimeout(connect, delay);
    };
  }, []); // stable reference — isAuthRef.current is read at call time

  useEffect(() => {
    if (!isAuth) {
      // User logged out — close cleanly and cancel any pending reconnect
      clearTimeout(reconnectTimeout.current);
      retries.current = 0;
      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close(1000, 'User logged out');
      }
      return;
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.close(1000, 'Component unmount');
        ws.current = null;
      }
    };
  }, [isAuth, connect]);

  return (
    <WebSocketContext.Provider value={{ subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocket must be used inside <WebSocketProvider>');
  }
  return ctx;
};
