"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationProps } from '../components/Notification';

interface NotificationItem extends Omit<NotificationProps, 'onClose'> {
  id: string;
}

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const showNotification = (
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'info', 
    duration = 5000
  ) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};