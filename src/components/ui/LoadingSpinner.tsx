/**
 * LoadingSpinner component
 * 
 * A reusable loading indicator with customizable message
 */
import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  testId?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  testId = 'loading-spinner'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="text-center py-8" data-testid={testId}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-500 mx-auto`}></div>
      {message && <p className="mt-2 text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );
};

export default LoadingSpinner; 