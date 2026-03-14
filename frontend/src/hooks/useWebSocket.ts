'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WSMessage {
  event: string;
  data: unknown;
  timestamp: string;
}

type MessageHandler = (msg: WSMessage) => void;

export function useWebSocket(onMessage?: MessageHandler) {
  const wsRef          = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef     = useRef(0);

  // Store the latest handler in a ref so `connect` never needs it in its
  // dependency array — avoids the infinite-reconnect loop where a new
  // inline arrow function on every render caused connect → useEffect → connect.
  const handlerRef = useRef<MessageHandler | undefined>(onMessage);
  useEffect(() => { handlerRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    const WS_URL =
      process.env.NEXT_PUBLIC_WS_URL ||
      'wss://agridrishti-project.onrender.com';

    // Don't open a second socket if one is already open/connecting
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        attemptRef.current = 0;
      };

      ws.onmessage = (evt: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(evt.data) as WSMessage;
          handlerRef.current?.(msg);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Exponential back-off: 1 s → 2 s → 4 s … capped at 30 s
        const delay = Math.min(1_000 * 2 ** attemptRef.current, 30_000);
        attemptRef.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onclose fires right after onerror, so just close cleanly
        ws.close();
      };
    } catch {
      // WebSocket constructor can throw if the URL is malformed
    }
  }, []); // ← stable: no dependencies that change

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}

