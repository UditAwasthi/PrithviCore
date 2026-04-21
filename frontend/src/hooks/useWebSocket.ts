'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WSMessage {
  event: string;
  data: unknown;
  timestamp: string;
}

type MessageHandler = (msg: WSMessage) => void;

// Ping interval to match server heartbeat
const PING_INTERVAL = 20000; // 20 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(onMessage?: MessageHandler) {
  const wsRef          = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef     = useRef(0);

  // Store the latest handler in a ref so `connect` never needs it in its
  // dependency array — avoids the infinite-reconnect loop where a new
  // inline arrow function on every render caused connect → useEffect → connect.
  const handlerRef = useRef<MessageHandler | undefined>(onMessage);
  useEffect(() => { handlerRef.current = onMessage; }, [onMessage]);

  // Send periodic pings to keep connection alive
  const startPing = useCallback(() => {
    if (pingTimer.current) clearInterval(pingTimer.current);
    pingTimer.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: 'ping' }));
      }
    }, PING_INTERVAL);
  }, []);

  const stopPing = useCallback(() => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    // Check max reconnect attempts
    if (attemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setError(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Please refresh the page.`);
      return;
    }

    const WS_URL =
      process.env.NEXT_PUBLIC_WS_URL ||
      'wss://prithvicore-project.onrender.com';

    // Don't open a second socket if one is already open/connecting
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        attemptRef.current = 0;
        startPing();
        console.log('[WS] Connected to', WS_URL);
      };

      ws.onmessage = (evt: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(evt.data) as WSMessage;
          
          // Handle pong response from server
          if (msg.event === 'pong') {
            return;
          }
          
          handlerRef.current?.(msg);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = (event) => {
        setConnected(false);
        stopPing();
        
        // Log close event for debugging
        console.log('[WS] Disconnected. Code:', event.code, 'Reason:', event.reason || 'none');
        
        // Exponential back-off: 1 s → 2 s → 4 s … capped at 30 s
        const delay = Math.min(1_000 * 2 ** attemptRef.current, 30_000);
        attemptRef.current += 1;
        
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${attemptRef.current})`);
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = (event) => {
        console.error('[WS] Error:', event);
        setError('WebSocket connection error');
        // onclose fires right after onerror, so just close cleanly
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [startPing, stopPing]); // ← stable: no dependencies that change

  useEffect(() => {
    connect();
    return () => {
      stopPing();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect, stopPing]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    attemptRef.current = 0;
    setError(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  return { connected, error, reconnect };
}

