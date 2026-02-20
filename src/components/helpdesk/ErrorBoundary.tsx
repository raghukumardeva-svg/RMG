import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: any;
    retryCount: number;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: any) => void;
    maxRetries?: number;
}

export class HelpdeskErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        this.setState({
            error,
            errorInfo
        });

        // Log error to monitoring service
        console.error('Helpdesk Error Boundary caught an error:', error, errorInfo);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // Report to error tracking service (e.g., Sentry)
        if (process.env.NODE_ENV === 'production') {
            // Report error to your tracking service
            // Example: Sentry.captureException(error, { contexts: { errorBoundary: errorInfo } });
        }
    }

    handleRetry = () => {
        const { maxRetries = 3 } = this.props;
        const { retryCount } = this.state;

        if (retryCount < maxRetries) {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: retryCount + 1
            });
        }
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0
        });
    };

    render() {
        const { hasError, error, retryCount } = this.state;
        const { children, fallback, maxRetries = 3 } = this.props;

        if (hasError) {
            // Custom fallback UI
            if (fallback) {
                return fallback;
            }

            // Determine error type for better user experience
            const isNetworkError = error?.message.includes('fetch') || error?.message.includes('network');
            const isChunkLoadError = error?.message.includes('ChunkLoadError') || error?.message.includes('Loading chunk');
            const canRetry = retryCount < maxRetries;

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <Card className="max-w-2xl w-full">
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">
                                {isChunkLoadError ? 'App Update Available' : isNetworkError ? 'Connection Error' : 'Something went wrong'}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Error-specific messages */}
                            {isChunkLoadError ? (
                                <Alert>
                                    <AlertDescription>
                                        The app has been updated. Please refresh the page to load the latest version.
                                    </AlertDescription>
                                </Alert>
                            ) : isNetworkError ? (
                                <Alert>
                                    <AlertDescription>
                                        Unable to connect to the server. Please check your internet connection and try again.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert>
                                    <AlertDescription>
                                        An unexpected error occurred in the helpdesk module. Our team has been notified.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Error details in development */}
                            {process.env.NODE_ENV === 'development' && (
                                <Card className="bg-gray-50 dark:bg-gray-800">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Bug className="w-4 h-4" />
                                            Error Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-48">
                                            {error?.toString()}
                                            {this.state.errorInfo?.componentStack}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Retry count indicator */}
                            {retryCount > 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    Retry attempt {retryCount} of {maxRetries}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                {isChunkLoadError ? (
                                    <Button
                                        onClick={() => window.location.reload()}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh Page
                                    </Button>
                                ) : canRetry ? (
                                    <Button
                                        onClick={this.handleRetry}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Try Again
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={this.handleReset}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Reset
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/'}
                                    className="flex items-center gap-2"
                                >
                                    <Home className="w-4 h-4" />
                                    Go to Dashboard
                                </Button>
                            </div>

                            {/* Contact support */}
                            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                Need help? Contact{' '}
                                <a
                                    href="mailto:support@company.com"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    IT Support
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return children;
    }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
    return function WrappedComponent(props: P) {
        return (
            <HelpdeskErrorBoundary {...errorBoundaryProps}>
                <Component {...props} />
            </HelpdeskErrorBoundary>
        );
    };
}

// Hook for error handling in functional components
export function useErrorHandler() {
    return React.useCallback((error: Error, errorInfo?: any) => {
        console.error('Error caught by error handler:', error, errorInfo);

        // Could integrate with error reporting service
        if (process.env.NODE_ENV === 'production') {
            // Report to error tracking service
        }
    }, []);
}

// Component-level error boundary for smaller sections
export const ComponentErrorBoundary: React.FC<{
    children: ReactNode;
    componentName?: string;
    className?: string;
}> = ({ children, componentName = 'Component', className = '' }) => {
    return (
        <HelpdeskErrorBoundary
            fallback={
                <div className={`p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 ${className}`}>
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {componentName} Error
                        </span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        This component encountered an error and couldn't be displayed.
                    </p>
                </div>
            }
        >
            {children}
        </HelpdeskErrorBoundary>
    );
};