/**
 * DashboardCard component
 * 
 * A reusable card component for dashboard sections with consistent styling
 */
import React from 'react';

export interface DashboardCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  children,
  className = '',
  testId = 'dashboard-card'
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden ${className}`}
      data-testid={testId}
    >
      {(title || description) && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard; 