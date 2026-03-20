import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

export const useWebSockets = (onEvent: (data: any) => void) => {
  const { accessToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket: Socket = io('http://localhost:3001', {
      auth: {
        token: accessToken,
      },
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to server');
    });

    socket.on('webhook_event', (data) => {
      console.log('[WebSocket] Received event:', data);
      onEvent(data);
    });

    socket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, isAuthenticated, onEvent]);
};
