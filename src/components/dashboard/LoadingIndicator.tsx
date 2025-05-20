'use client';

export interface LoadingIndicatorProps {
  message?: string;
  testId?: string;
}

/**
 * Loading indicator for dashboard components
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = 'Loading...', 
  testId = 'loading-indicator' 
}) => (
  <div className="text-center py-8" data-testid={testId}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
    <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

export default LoadingIndicator; 