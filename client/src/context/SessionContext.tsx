'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSessionId } from '../utils/session';

interface SessionContextType {
  sessionId: string;
  refreshSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');

  const refreshSession = () => {
    const newSessionId = getSessionId();
    setSessionId(newSessionId);
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <SessionContext.Provider value={{ sessionId, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
};