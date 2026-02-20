import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

/**
 * Hook to enforce IT Admin role-based access control
 * Redirects non-IT Admin users to dashboard with error message
 */
export function useITAdminGuard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to access this page');
      navigate('/auth/login');
      return;
    }

    // Strict role check - ONLY IT_ADMIN can access
    if (user?.role !== 'IT_ADMIN') {
      toast.error('Access denied. This area is restricted to IT Administrators only.');
      navigate('/dashboard');
    }
  }, [user, isAuthenticated, navigate]);

  // Return guard status and user info
  return {
    isITAdmin: user?.role === 'IT_ADMIN',
    user,
    isAuthenticated,
  };
}

/**
 * Component-level guard that can be used inline
 */
export function checkITAdminAccess(userRole?: string): boolean {
  return userRole === 'IT_ADMIN';
}
