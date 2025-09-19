// components/ProtectedRoute.tsx
'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Jika sudah selesai loading dan tidak terautentikasi, redirect
    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [loading, isAuthenticated, router, redirectTo]);

  // Jika masih loading, tampilkan indikator loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Jika tidak terautentikasi, tampilkan null (akan segera redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Jika terautentikasi, tampilkan children
  return <>{children}</>;
}