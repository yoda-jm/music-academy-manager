import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

interface UseSocketReturn {
  socket: Socket | null;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => () => void;
}

let socketInstance: Socket | null = null;

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      socketRef.current = null;
      return;
    }

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: {
          token: tokenStorage.getAccessToken(),
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance?.id);
      });

      socketInstance.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
      });

      socketInstance.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error.message);
      });
    }

    socketRef.current = socketInstance;

    return () => {
      // Keep socket alive across component unmounts
    };
  }, [isAuthenticated]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
  };
}
