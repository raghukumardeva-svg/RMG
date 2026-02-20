import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useHelpdeskStore } from '@/store/helpdeskStore';
import type { HelpdeskFormData } from '@/types/helpdeskNew';

interface GlobalHelpdeskContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  submitRequest: (formData: HelpdeskFormData) => Promise<void>;
  isSubmitting: boolean;
}

const GlobalHelpdeskContext = createContext<GlobalHelpdeskContextType | undefined>(undefined);

interface GlobalHelpdeskProviderProps {
  children: ReactNode;
}

export function GlobalHelpdeskProvider({ children }: GlobalHelpdeskProviderProps) {
  const { user } = useAuthStore();
  const { createWithWorkflow } = useHelpdeskStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const submitRequest = useCallback(
    async (formData: HelpdeskFormData) => {
      if (!user?.id || !user?.name || !user?.email) {
        console.error('[GlobalHelpdeskContext] Missing user data. User:', user);
        toast.error('User information is incomplete. Please try logging in again.');
        throw new Error('User not authenticated');
      }

      setIsSubmitting(true);
      try {
        // Use the store method which includes all notification logic
        await createWithWorkflow(
          formData,
          user.id,
          user.name,
          user.email,
          user.department
        );
        closeDrawer();

        // Dispatch custom event to notify other components to refresh data
        window.dispatchEvent(new CustomEvent('helpdesk-request-created'));
      } catch (error) {
        console.error('Failed to submit request:', error);
        // Error toast is already shown by the store
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, closeDrawer, createWithWorkflow]
  );

  return (
    <GlobalHelpdeskContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        submitRequest,
        isSubmitting,
      }}
    >
      {children}
    </GlobalHelpdeskContext.Provider>
  );
}

export function useGlobalHelpdesk() {
  const context = useContext(GlobalHelpdeskContext);
  if (context === undefined) {
    throw new Error('useGlobalHelpdesk must be used within a GlobalHelpdeskProvider');
  }
  return context;
}
