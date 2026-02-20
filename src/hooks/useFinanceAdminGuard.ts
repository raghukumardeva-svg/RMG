import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

/**
 * Hook to enforce Finance Admin role-based access control
 * Redirects non-Finance Admin users to dashboard with error message
 */
export function useFinanceAdminGuard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to access this page');
      navigate('/auth/login');
      return;
    }

    // Strict role check - ONLY FINANCE_ADMIN can access
    if (user?.role !== 'FINANCE_ADMIN') {
      toast.error('Access denied. This area is restricted to Finance Administrators only.');
      navigate('/dashboard');
    }
  }, [user, isAuthenticated, navigate]);

  // Return guard status and user info
  return {
    isFinanceAdmin: user?.role === 'FINANCE_ADMIN',
    user,
    isAuthenticated,
  };
}

/**
 * Component-level guard that can be used inline
 */
export function checkFinanceAdminAccess(userRole?: string): boolean {
  return userRole === 'FINANCE_ADMIN';
}
