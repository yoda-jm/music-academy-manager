import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  if (allowedRoles && user.role !== Role.SUPER_ADMIN && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Access Denied
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          You don't have permission to access this page. Contact your administrator if you
          believe this is a mistake.
        </p>
        <Link
          to="/"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
