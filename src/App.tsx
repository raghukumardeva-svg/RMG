import { ThemeProvider } from '@/theme/ThemeProvider';
import { AppRouter } from '@/router/AppRouter';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

function App() {
  return (
    <div className="h-full">
      <ThemeProvider>
        <ErrorBoundary>
          <AppRouter />
          <Toaster 
            position="top-right" 
            expand={true}
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              classNames: {
                toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl',
                title: 'group-[.toast]:font-semibold group-[.toast]:text-sm',
                description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-xs',
                actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs',
                cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs',
                success: 'group-[.toaster]:!bg-emerald-50 group-[.toaster]:!border-emerald-200 group-[.toaster]:!text-emerald-800 dark:group-[.toaster]:!bg-emerald-950 dark:group-[.toaster]:!border-emerald-800 dark:group-[.toaster]:!text-emerald-200',
                error: 'group-[.toaster]:!bg-red-50 group-[.toaster]:!border-red-200 group-[.toaster]:!text-red-800 dark:group-[.toaster]:!bg-red-950 dark:group-[.toaster]:!border-red-800 dark:group-[.toaster]:!text-red-200',
                warning: 'group-[.toaster]:!bg-amber-50 group-[.toaster]:!border-amber-200 group-[.toaster]:!text-amber-800 dark:group-[.toaster]:!bg-amber-950 dark:group-[.toaster]:!border-amber-800 dark:group-[.toaster]:!text-amber-200',
                info: 'group-[.toaster]:!bg-blue-50 group-[.toaster]:!border-blue-200 group-[.toaster]:!text-blue-800 dark:group-[.toaster]:!bg-blue-950 dark:group-[.toaster]:!border-blue-800 dark:group-[.toaster]:!text-blue-200',
              },
            }}
            icons={{
              success: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
              error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
              warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
              info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
              loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
            }}
          />
        </ErrorBoundary>
      </ThemeProvider>
    </div>
  );
}

export default App;
