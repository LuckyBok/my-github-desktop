'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import FileList from '@/components/FileList';
import FileUploader from '@/components/FileUploader';
import CsvExporter from '@/components/CsvExporter';
import StatisticsPanel from '@/components/StatisticsPanel';
import ThemeToggle from '@/components/ThemeToggle';
import DownloadAllFiles from '@/components/DownloadAllFiles';
import RevenueTracker from '@/components/RevenueTracker';
import InstructorBranding from '@/components/InstructorBranding';
import WeeklyReportGenerator from '@/components/WeeklyReportGenerator';
import LectureRequests from '@/components/LectureRequests';
import TemplateManager from '@/components/TemplateManager';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [showUploader, setShowUploader] = useState(false);
  const [showRevenueTracker, setShowRevenueTracker] = useState(false);
  const [showInstructorBranding, setShowInstructorBranding] = useState(false);
  const [showWeeklyReports, setShowWeeklyReports] = useState(false);
  const [showLectureRequests, setShowLectureRequests] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header - Responsive for mobile */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Admin Dashboard</h1>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <ThemeToggle />
            <button
              onClick={() => signOut()}
                  className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-400 dark:focus:ring-offset-gray-800"
            >
              Sign Out
            </button>
              </div>
            </div>
            
            {/* Display admin email */}
            {user && user.email && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Logged in as: <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {/* Dashboard sections - stack vertically on mobile */}
          <div className="space-y-8">
            {/* Admin Tools Section */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
                    Admin Tools
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowUploader(!showUploader)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
                    >
                      {showUploader ? 'Hide Uploader' : 'Upload New File'}
                    </button>
                    <button
                      onClick={() => setShowRevenueTracker(!showRevenueTracker)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800"
                    >
                      {showRevenueTracker ? 'Hide Revenue Tracker' : 'Manage Revenue'}
                    </button>
                    <button
                      onClick={() => setShowInstructorBranding(!showInstructorBranding)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                    >
                      {showInstructorBranding ? 'Hide Branding' : 'Manage Profile'}
                    </button>
                    <button
                      onClick={() => setShowWeeklyReports(!showWeeklyReports)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-800"
                    >
                      {showWeeklyReports ? 'Hide Reports' : 'Weekly Reports'}
                    </button>
                    <button
                      onClick={() => setShowLectureRequests(!showLectureRequests)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-800"
                    >
                      {showLectureRequests ? 'Hide Requests' : 'Lecture Requests'}
                    </button>
                    <button
                      onClick={() => setShowTemplateManager(!showTemplateManager)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-pink-600 text-white hover:bg-pink-700 dark:bg-pink-600 dark:hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 dark:focus:ring-offset-gray-800"
                    >
                      {showTemplateManager ? 'Hide Templates' : 'Manage Templates'}
                    </button>
                    <CsvExporter />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Manage your profile, track revenue, generate reports, manage lecture requests, and upload files.
                </p>
                
                {/* Download All Files as ZIP */}
                <div className="mt-4">
                  <DownloadAllFiles />
                </div>
              </div>
            </div>
            
            {/* Template Manager Section (Conditional) */}
            {showTemplateManager && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <TemplateManager />
                </div>
              </div>
            )}
            
            {/* Lecture Requests Section (Conditional) */}
            {showLectureRequests && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <LectureRequests />
                </div>
              </div>
            )}
            
            {/* Weekly Reports Section (Conditional) */}
            {showWeeklyReports && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                    Weekly Report Generator
                  </h2>
                  <WeeklyReportGenerator />
                </div>
              </div>
            )}
            
            {/* Instructor Branding Section (Conditional) */}
            {showInstructorBranding && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                    Personal Branding & Growth
                  </h2>
                  <InstructorBranding />
                </div>
              </div>
            )}
            
            {/* Revenue Tracker Section (Conditional) */}
            {showRevenueTracker && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                    Revenue Tracking & ROI Analysis
                  </h2>
                  <RevenueTracker />
                </div>
              </div>
            )}
            
            {/* File Uploader Section (Conditional) */}
            {showUploader && (
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                    Upload New File
                  </h2>
                  <FileUploader />
                </div>
              </div>
            )}
            
            {/* Statistics Panel */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                  Analytics
                </h2>
                <StatisticsPanel />
              </div>
            </div>
            
            {/* File Management Section */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-4">
                  File Management
                </h2>
                <FileList isAdmin className="mt-4" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 