import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

/**
 * Hook to enforce Facilities Admin role-based access control
 * Redirects non-Facilities Admin users to dashboard with error message
 */
export function useFacilitiesAdminGuard() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to access this page');
      navigate('/auth/login');
      return;
    }

    // Strict role check - ONLY FACILITIES_ADMIN can access
    if (user?.role !== 'FACILITIES_ADMIN') {
      toast.error('Access denied. This area is restricted to Facilities Administrators only.');
      navigate('/dashboard');
    }
  }, [user, isAuthenticated, navigate]);

  // Return guard status and user info
  return {
    isFacilitiesAdmin: user?.role === 'FACILITIES_ADMIN',
    user,
    isAuthenticated,
  };
}

/**
 * Component-level guard that can be used inline
 */
export function checkFacilitiesAdminAccess(userRole?: string): boolean {
  return userRole === 'FACILITIES_ADMIN';
}
