'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../utils/api';
import { useNotification } from './NotificationContext';

interface Permission {
  id: string;
  name: string;
}

interface RolePermission {
  id: string;
  permissions: Permission;
}

interface Role {
  id: string;
  name: string;
  role_permissions: RolePermission[];
}

interface RoleUser {
  id: string;
  roles: Role;
}

interface carts {
  id: string;
  userId: string;
  sessionId: string;
}

interface addresses {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface User {
  id: string,
  fullname: string;
  username: string;
  email: string;
  hashedRt: string;
  role_users: RoleUser[];
  carts: carts[],
  addresses: addresses[],
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<boolean>;
  refetch: () => Promise<boolean>;
  hasPermission: (permissionName: string) => boolean;
  getUserRoles: () => string[];
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState({
    user: null as User | null,
    loading: true,
    isAuthenticated: false,
    error: null as string | null
  });

  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true }));
        
        const response = await api.post('/auth/me');
        
        const userData = response.data.data;
        
        setAuthState({
          user: userData,
          loading: false,
          isAuthenticated: true,
          error: null
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Authentication failed';
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          error: error.response?.data?.message || 'Authentication failed'
        });
        showNotification(errorMessage, 'error');
      }
    };

    fetchUser();
  }, []);

  const logout = async (): Promise<boolean> => {
    try {
      await api.post('/auth/logout');
      
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Logout failed';
      setAuthState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Logout failed'
      }));

      showNotification(errorMessage, 'error');
      return false;
    }
  };

  const refetch = async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const response = await api.post('/auth/me');
      
      // Data user berada di response.data.data
      const userData = response.data.data;
      
      setAuthState({
        user: userData,
        loading: false,
        isAuthenticated: true,
        error: null
      });
      
      showNotification('Data pengguna berhasil diperbarui', 'success');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Authentication failed';
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: error.response?.data?.message || 'Authentication failed'
      });
      
      showNotification(errorMessage, 'error');
      return false;
    }
  };

  // Fungsi untuk mengecek apakah user memiliki permission tertentu
  const hasPermission = (permissionName: string): boolean => {
    if (!authState.user || !authState.user.role_users) {
      return false;
    }
    
    // Loop melalui semua role user
    for (const roleUser of authState.user.role_users) {
      // Loop melalui semua permissions di role
      for (const rolePermission of roleUser.roles.role_permissions) {
        if (rolePermission.permissions.name === permissionName) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Fungsi untuk mendapatkan semua role user
  const getUserRoles = (): string[] => {
    if (!authState.user || !authState.user.role_users) {
      return [];
    }
    
    return authState.user.role_users.map(roleUser => roleUser.roles.name);
  };

  return (
    <AuthContext.Provider value={{ 
      ...authState,
      logout,
      refetch,
      hasPermission,
      getUserRoles
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}