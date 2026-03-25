'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'incident' | 'prediction' | 'system';
  severity?: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  seedNotifications: (items: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  seeded: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  seedNotifications: () => {},
  markAsRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
  seeded: false,
});

const MAX_NOTIFICATIONS = 50;
const LOCAL_STORAGE_KEY = 'civictwin-read-notifs';

const getReadIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

const saveReadIds = (ids: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counterRef = useRef(0);
  const [seeded, setSeeded] = useState(false);

  // Load from local storage initially inside seedNotifications

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    counterRef.current += 1;
    const newId = `notif-${Date.now()}-${counterRef.current}`;
    const readIds = getReadIds();
    
    const newNotification: Notification = {
      ...n,
      id: newId,
      timestamp: new Date(),
      read: readIds.has(newId),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const seedNotifications = useCallback((items: Notification[]) => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const readIds = getReadIds();
      const newItems = items
        .filter(i => !existingIds.has(i.id))
        .map(i => ({ ...i, read: i.read || readIds.has(i.id) }));
      return [...prev, ...newItems].slice(0, MAX_NOTIFICATIONS);
    });
    setSeeded(true);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const ids = getReadIds();
    ids.add(id);
    saveReadIds(ids);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      const ids = getReadIds();
      next.forEach(n => ids.add(n.id));
      saveReadIds(ids);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, seedNotifications, markAsRead, markAllRead, clearAll, seeded }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

