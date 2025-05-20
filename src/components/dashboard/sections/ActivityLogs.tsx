'use client';

import { BaseSectionProps, LogEntry } from '../types';

export interface ActivityLogsProps extends BaseSectionProps {
  logs?: LogEntry[];
  loading?: boolean;
}

// Sample data - in a real app, this would come from props or an API
const sampleLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2023-05-15 14:32',
    user: 'admin@example.com',
    action: 'File Upload',
    details: 'Uploaded presentation.pdf'
  },
  {
    id: '2',
    timestamp: '2023-05-14 09:15',
    user: 'user1@example.com',
    action: 'Login',
    details: 'Successful login'
  },
  {
    id: '3',
    timestamp: '2023-05-13 16:45',
    user: 'admin@example.com',
    action: 'Settings Change',
    details: 'Updated profile information'
  }
];

/**
 * Activity Logs section for the admin dashboard
 * Displays a table of system activity logs
 */
const ActivityLogs: React.FC<ActivityLogsProps> = ({ 
  logs = sampleLogs,
  loading = false,
  testId = 'activity-logs-section'
}) => {
  return (
    <div className="p-4" data-testid={testId}>
      <h3 className="text-lg font-medium mb-4">Activity Logs</h3>
      <p className="text-gray-500 dark:text-gray-400">View system activity logs and user actions.</p>
      
      <div className="mt-6 border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  Loading activity logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} data-testid={`log-entry-${log.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs; 