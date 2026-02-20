import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalHelpdeskProvider, useGlobalHelpdesk } from '@/contexts/GlobalHelpdeskContext';
import { RaiseRequestDrawer } from '@/components/helpdesk/RaiseRequestDrawer';

function DashboardLayoutContent() {
  const { isDrawerOpen, closeDrawer, submitRequest, isSubmitting } = useGlobalHelpdesk();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin" role="main">
          <div className="mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Helpdesk Drawer */}
      <RaiseRequestDrawer
        open={isDrawerOpen}
        onOpenChange={closeDrawer}
        onSubmit={submitRequest}
        isLoading={isSubmitting}
      />
    </div>
  );
}

export function DashboardLayout() {
  return (
    <GlobalHelpdeskProvider>
      <DashboardLayoutContent />
    </GlobalHelpdeskProvider>
  );
}
