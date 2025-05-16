'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        // Redirect to home if not admin but admin access is required
        router.push('/');
      }
    }
  }, [user, loading, isAdmin, requireAdmin, router]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated or not admin (when required), don't render children
  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  // If authenticated and admin (when required), render children
  return <>{children}</>;
} 