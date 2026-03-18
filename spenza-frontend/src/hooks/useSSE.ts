import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';

type SSEHandler = (data: Record<string, unknown>) => void;

export const useSSE = (onEvent: SSEHandler) => {
  const token = useAuthStore((s) => s.accessToken);
  const esRef = useRef<EventSource | null>(null);
  const handlerRef = useRef(onEvent);

  // Update ref whenever handler changes, without triggering useEffect
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!token) return;

    const url = `${import.meta.env.VITE_SSE_URL}?token=${token}`;
    const es = new EventSource(url);
    esRef.current = es;

    const handleEvent = (e: MessageEvent) => {
      try {
        handlerRef.current(JSON.parse(e.data));
      } catch {
        console.error('Failed to parse SSE event');
      }
    };

    es.addEventListener('webhook_event', handleEvent as any);

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [token]); // Only reconnect if token changes
};