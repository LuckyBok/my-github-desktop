'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import IncomeForm from './IncomeForm';
import IncomeTable from './IncomeTable';
import IncomeAnalytics from './IncomeAnalytics';

export default function RevenueTracker() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'form' | 'table' | 'analytics'>('form');
  const [dataUpdated, setDataUpdated] = useState(0); // Counter to trigger refreshes

  // Only show to admins
  if (!isAdmin) {
    return null;
  }

  const handleIncomeAdded = () => {
    // Increment counter to trigger data refresh in child components
    setDataUpdated(prev => prev + 1);
    
    // Switch to the table view after adding income
    setActiveTab('table');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('form')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === 'form'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Add Revenue
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === 'table'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Revenue History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              ROI Analysis
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'form' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Revenue Entry</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Record new income from organizations or projects. All fields marked with * are required.
              </p>
              <IncomeForm onSuccess={handleIncomeAdded} />
            </div>
          )}
          
          {activeTab === 'table' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue History</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                View and filter all recorded income entries by month or organization.
              </p>
              <IncomeTable key={`income-table-${dataUpdated}`} />
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">ROI Analysis</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Analyze your revenue streams with detailed metrics and visualizations.
              </p>
              <IncomeAnalytics key={`income-analytics-${dataUpdated}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 