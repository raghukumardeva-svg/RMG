import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from './roleConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPath: string;
}

export function ProtectedRoute({ children, requiredPath }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(user.role, requiredPath)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
