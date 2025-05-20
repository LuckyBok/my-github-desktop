'use client';

import { SectionId } from './types';

export interface TabProps {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (id: SectionId) => void;
  testId?: string;
}

/**
 * Tab component for dashboard navigation
 * Handles tab UI and accessibility requirements
 */
const DashboardTab: React.FC<TabProps> = ({ 
  id, 
  label, 
  icon, 
  isActive, 
  onClick,
  testId = `tab-${id}`
}) => {
  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      data-testid={testId}
      className={`inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors ${
        isActive 
          ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
      onClick={() => onClick(id)}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
};

export default DashboardTab; 