/**
 * TabGroup component
 * 
 * A reusable tab interface component with ARIA support
 */
import React, { useState } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface TabGroupProps {
  tabs: TabItem[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  testId?: string;
}

const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  activeTab: controlledActiveTab,
  onChange,
  className = '',
  testId = 'tab-group'
}) => {
  // Support both controlled and uncontrolled modes
  const [internalActiveTab, setInternalActiveTab] = useState<string>(tabs[0]?.id);
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  return (
    <div className={`${className}`} data-testid={testId}>
      {/* Tab List */}
      <div 
        className="flex flex-wrap border-b border-gray-200 dark:border-gray-700" 
        role="tablist" 
        aria-orientation="horizontal"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            data-testid={`tab-${tab.id}`}
            className={`inline-flex items-center px-4 py-3 text-sm font-medium border-b-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Panels */}
      <div className="py-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            data-testid={`panel-${tab.id}`}
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabGroup; 