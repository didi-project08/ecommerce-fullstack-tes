// utils/session.ts

export const generateSessionId = (): string => {
  // Generate a unique session ID
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export const getSessionId = (): string => {
  // Check if session ID exists in localStorage
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('sessionId');
    
    // If no session ID exists, create one and store it
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('sessionId', sessionId);
    }
    
    return sessionId;
  }
  
  // Return a temporary session ID for server-side rendering
  return '';
};

export const clearSessionId = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sessionId');
  }
};