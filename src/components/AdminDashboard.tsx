'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

// Import shared types and components
import { SectionId } from './dashboard/types';
import useSectionToggle from '@/hooks/useSectionToggle';

// Import reusable UI components
import DashboardCard from './ui/DashboardCard';
import LoadingSpinner from './ui/LoadingSpinner';
import DashboardTab from './dashboard/DashboardTab';

// Import extracted section components
import { UserManagement, SettingsPanel, ActivityLogs } from './dashboard/sections';

// Dynamically import client-side only components with loading fallbacks
const FileUploader = dynamic(() => import('@/components/FileUploader'), { 
  ssr: false,
  loading: () => <LoadingSpinner message="Loading File Uploader..." />
});

const RevenueTracker = dynamic(() => import('@/components/RevenueTracker'), { 
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Revenue Tracker..." />
});

const WeeklyReportGenerator = dynamic(() => import('@/components/WeeklyReportGenerator'), { 
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Report Generator..." />
});

/**
 * Admin Dashboard component
 * Main container for administrative functionality
 */
export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  // Use custom hook for section toggle state management
  const { activeSection, setActiveSection } = useSectionToggle<SectionId>('fileUploader');
  
  // Define dashboard sections
  const dashboardSections = [
    {
      id: 'fileUploader' as SectionId,
      label: 'File Uploader',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      id: 'revenueTracker' as SectionId,
      label: 'Revenue Tracker',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'weeklyReport' as SectionId,
      label: 'Weekly Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'activityLogs' as SectionId,
      label: 'Activity Logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'userManagement' as SectionId,
      label: 'User Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'settings' as SectionId,
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (authLoading) {
    return <LoadingSpinner message="Checking admin access..." testId="auth-loading" />;
  }

  if (!isAdmin) {
    return (
      <DashboardCard testId="access-denied">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Access Denied</h3>
        <p className="text-gray-500 dark:text-gray-400">
          You need admin privileges to access this dashboard.
        </p>
      </DashboardCard>
    );
  }

  // Ensure component is mounted before rendering client-side components
  if (!isMounted) {
    return <LoadingSpinner message="Loading dashboard..." testId="dashboard-loading" />;
  }

  /**
   * Renders the appropriate component based on active section
   */
  const renderActiveSection = () => {
    if (!activeSection) return null;
    
    switch (activeSection) {
      case 'fileUploader':
        return <FileUploader />;
      case 'revenueTracker':
        return <RevenueTracker />;
      case 'weeklyReport':
        return <WeeklyReportGenerator />;
      case 'activityLogs':
        return <ActivityLogs testId="activity-logs-content" />;
      case 'userManagement':
        return <UserManagement testId="user-management-content" />;
      case 'settings':
        return <SettingsPanel testId="settings-panel-content" />;
      default:
        return (
          <div className="text-center py-8" data-testid="dashboard-default-view">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dashboard Overview</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Select a section above to manage your content.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h2>
      </div>

      {/* Dashboard Content */}
      <DashboardCard className="p-0">
        {/* Tab List */}
        <div 
          className="flex flex-wrap border-b border-gray-200 dark:border-gray-700" 
          role="tablist" 
          aria-orientation="horizontal"
          data-testid="dashboard-tabs"
        >
          {dashboardSections.map((section) => (
            <DashboardTab
              key={section.id}
              id={section.id}
              label={section.label}
              icon={section.icon}
              isActive={activeSection === section.id}
              onClick={setActiveSection}
              testId={`tab-${section.id}`}
            />
          ))}
        </div>
        
        {/* Tab Panels */}
        <div className="p-6" data-testid="tab-content-container">
          {activeSection && (
            <div 
              id={`panel-${activeSection}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeSection}`}
              data-testid={`panel-${activeSection}`}
            >
              {renderActiveSection()}
            </div>
          )}
        </div>
      </DashboardCard>
    </div>
  );
} 