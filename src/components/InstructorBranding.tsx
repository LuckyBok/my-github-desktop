'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import InstructorProfile from './InstructorProfile';
import InstructorGrowth from './InstructorGrowth';

export default function InstructorBranding() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'growth'>('profile');

  // Only show to admins
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Instructor Profile
            </button>
            <button
              onClick={() => setActiveTab('growth')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === 'growth'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Growth Metrics
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Branding</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Personalize your professional profile to showcase your expertise and teaching style.
              </p>
              <InstructorProfile />
            </div>
          )}
          
          {activeTab === 'growth' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Professional Growth</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Track your growth as an instructor through key metrics like lectures created and revenue generated.
              </p>
              <InstructorGrowth />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 