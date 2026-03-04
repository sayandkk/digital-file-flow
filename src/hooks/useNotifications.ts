import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { notificationsApi } from '@/lib/api';

export interface AppNotification {
  id: string; // DB id
  type:
    | 'WORKFLOW_APPROVAL'
    | 'WORKFLOW_REJECTED'
    | 'WORKFLOW_COMPLETED'
    | 'REQUEST_STATUS'
    | 'FILE_ASSIGNED'
    | 'GENERAL';
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  link?: string;
  timestamp: string; // ISO string (maps from createdAt for DB records)
  read: boolean;
}

// In Docker the frontend is served by nginx which proxies /socket.io/ → backend:3001
// In local dev (vite) it connects to localhost:3001 directly
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── API-backed actions ──────────────────────────────────────────────────────

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try { await notificationsApi.markRead(id); } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await notificationsApi.markAllRead(); } catch { /* silent */ }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try { await notificationsApi.dismiss(id); } catch { /* silent */ }
  }, []);

  // ── Load persisted notifications from DB ──────────────────────────────────

  const loadNotifications = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[Notifications] No token — skipping load');
      return;
    }
    console.log('[Notifications] Fetching from /api/v1/notifications…');
    notificationsApi.list()
      .then((res) => {
        console.log('[Notifications] Loaded', res.data?.length ?? 0, 'notifications');
        const records: AppNotification[] = (Array.isArray(res.data) ? res.data : []).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          entityId: n.entityId,
          entityType: n.entityType,
          link: n.link,
          read: n.read,
          timestamp: n.createdAt, // normalise DB field name
        }));
        setNotifications(records);
      })
      .catch((err) => {
        console.warn('[Notifications] Failed to load persisted notifications:', err?.response?.status, err.message);
      });
  }, []);

  // ── On-mount: load persisted notifications then open socket ────────────────

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // 1. Fetch existing notifications from DB
    loadNotifications();

    // 2. Connect WebSocket for real-time updates
    const socket = io(WS_URL, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[Notifications] WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[Notifications] WebSocket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('[Notifications] Connection error:', err.message);
    });

    // Real-time notification arrives — server includes the DB id
    socket.on('notification', (payload: AppNotification & { timestamp: string }) => {
      setNotifications((prev) => {
        // Avoid duplicates (e.g. if list was already fetched)
        if (prev.some((n) => n.id === payload.id)) return prev;
        return [{ ...payload, read: false }, ...prev].slice(0, 100);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return {
    notifications,
    unreadCount,
    connected,
    markRead,
    markAllRead,
    dismiss,
    refresh: loadNotifications,
  };
}
