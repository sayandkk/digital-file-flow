import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification } from '@/lib/types';
import { api } from '@/lib/api';

interface NotificationContextProps {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>({
    notifications: [],
    unreadCount: 0,
    isConnected: false,
    markAsRead: async () => { },
    markAllAsRead: async () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const token = localStorage.getItem('access_token');
    const userString = localStorage.getItem('dms_user');
    const user = userString ? JSON.parse(userString) : null;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        if (user && token) {
            fetchNotifications();

            // Determine WebSocket URL - connect to same host as API but on WebSocket port
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
            
            // Extract the base URL without the path
            const urlObj = new URL(apiUrl);
            const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
            
            // Use the same host as the API but with WebSocket protocol and notifications namespace
            const socketUrl = `${baseUrl.replace('http', 'ws')}`;

            const newSocket = io(socketUrl, {
                auth: { token },
                path: '/notifications', // Use the namespace defined in the gateway
                transports: ['websocket', 'polling'], // Enable both transports for better compatibility
                timeout: 20000, // 20 second timeout
            });

            newSocket.on('connect', () => {
                console.log('Connected to WebSocket for notifications');
                setIsConnected(true);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Disconnected from WebSocket:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('WebSocket connection error:', err);
                setIsConnected(false);
            });

            newSocket.on('connect_timeout', (timeout) => {
                console.error('WebSocket connection timeout:', timeout);
                setIsConnected(false);
            });

            newSocket.on('new_notification', (notification: Notification) => {
                setNotifications((prev) => [notification, ...prev]);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            setNotifications([]);
        }
    }, [user?.id, token]); // user?.id prevents unneeded re-renders compared to user object

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((notif) =>
                    notif.id === id ? { ...notif, isRead: true } : notif
                )
            );
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications((prev) =>
                prev.map((notif) => ({ ...notif, isRead: true }))
            );
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isConnected, markAsRead, markAllAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};