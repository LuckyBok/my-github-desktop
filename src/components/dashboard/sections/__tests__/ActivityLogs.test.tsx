import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityLogs from '../ActivityLogs';
import { LogEntry } from '../../types';

// Sample test data
const mockLogs: LogEntry[] = [
  {
    id: 'test1',
    timestamp: '2023-06-01 10:00',
    user: 'test@example.com',
    action: 'Login',
    details: 'Test login'
  },
  {
    id: 'test2',
    timestamp: '2023-06-01 11:00',
    user: 'admin@example.com',
    action: 'Settings Update',
    details: 'Changed profile settings'
  }
];

describe('ActivityLogs', () => {
  // Test 1: Default state with sample data
  test('renders correctly with default sample data', () => {
    render(<ActivityLogs testId="test-activity-logs" />);
    
    // Check that the component renders
    expect(screen.getByTestId('test-activity-logs')).toBeInTheDocument();
    
    // Check heading
    expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    
    // Check that the sample data is rendered
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText('Uploaded presentation.pdf')).toBeInTheDocument();
  });
  
  // Test 2: With provided logs data
  test('renders provided logs data', () => {
    render(<ActivityLogs logs={mockLogs} testId="test-activity-logs" />);
    
    // Check that our custom logs are rendered
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Test login')).toBeInTheDocument();
    
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Settings Update')).toBeInTheDocument();
    expect(screen.getByText('Changed profile settings')).toBeInTheDocument();
  });
  
  // Test 3: Loading state
  test('shows loading indicator when loading prop is true', () => {
    render(<ActivityLogs loading={true} testId="test-activity-logs" />);
    
    // Check for loading message
    expect(screen.getByText('Loading activity logs...')).toBeInTheDocument();
    
    // Ensure log entries are not visible during loading
    expect(screen.queryByTestId('log-entry-1')).not.toBeInTheDocument();
  });
  
  // Test 4: Empty state
  test('shows empty state when logs array is empty', () => {
    render(<ActivityLogs logs={[]} testId="test-activity-logs" />);
    
    // Check for empty message
    expect(screen.getByText('No activity logs found.')).toBeInTheDocument();
  });
}); 