import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '../../AdminDashboard';
import { useAuth } from '@/context/AuthContext';

// Mock the auth context
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the dynamically imported components
jest.mock('@/components/FileUploader', () => () => <div data-testid="file-uploader">File Uploader Component</div>);
jest.mock('@/components/RevenueTracker', () => () => <div data-testid="revenue-tracker">Revenue Tracker Component</div>);
jest.mock('@/components/WeeklyReportGenerator', () => () => <div data-testid="weekly-report">Weekly Report Component</div>);

// Mock Next.js dynamic import
jest.mock('next/dynamic', () => (func) => {
  const component = func();
  component.displayName = 'DynamicComponent';
  return component;
});

describe('AdminDashboard', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  // Test 1: Dashboard should show loading when auth is loading
  test('shows loading indicator when auth is loading', () => {
    // Mock auth loading state
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: false,
      loading: true,
    });

    render(<AdminDashboard />);
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });

  // Test 2: Dashboard should show access denied when user is not admin
  test('shows access denied when user is not an admin', () => {
    // Mock non-admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: false,
      loading: false,
    });

    render(<AdminDashboard />);
    expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  // Test 3: Dashboard should render tabs when user is admin
  test('renders dashboard tabs for admin users', async () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
      loading: false,
    });

    // Use Object.defineProperty to mock isMounted
    Object.defineProperty(window, 'isMounted', { value: true });

    render(<AdminDashboard />);
    
    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    // Verify all tabs are rendered
    expect(screen.getByTestId('tab-fileUploader')).toBeInTheDocument();
    expect(screen.getByTestId('tab-revenueTracker')).toBeInTheDocument();
    expect(screen.getByTestId('tab-weeklyReport')).toBeInTheDocument();
    expect(screen.getByTestId('tab-activityLogs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-userManagement')).toBeInTheDocument();
    expect(screen.getByTestId('tab-settings')).toBeInTheDocument();
  });

  // Test 4: Clicking a tab should show correct content
  test('clicking a tab displays the corresponding content', async () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
      loading: false,
    });

    render(<AdminDashboard />);
    
    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    // First tab (File Uploader) should be active by default
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument();

    // Click the activity logs tab
    fireEvent.click(screen.getByTestId('tab-activityLogs'));
    
    // Activity logs content should now be visible
    await waitFor(() => {
      expect(screen.getByTestId('activity-logs-content')).toBeInTheDocument();
    });

    // Click the settings tab
    fireEvent.click(screen.getByTestId('tab-settings'));
    
    // Settings panel should now be visible
    await waitFor(() => {
      expect(screen.getByTestId('settings-panel-content')).toBeInTheDocument();
    });
  });

  // Test 5: Test accessibility attributes
  test('has correct accessibility attributes for tabs', async () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
      loading: false,
    });

    render(<AdminDashboard />);
    
    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    // Get first tab
    const firstTab = screen.getByTestId('tab-fileUploader');

    // Check aria attributes
    expect(firstTab).toHaveAttribute('role', 'tab');
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
    expect(firstTab).toHaveAttribute('aria-controls', 'panel-fileUploader');
    
    // Get corresponding panel
    const tabPanel = screen.getByTestId('panel-fileUploader');
    expect(tabPanel).toHaveAttribute('role', 'tabpanel');
    expect(tabPanel).toHaveAttribute('aria-labelledby', 'tab-fileUploader');
  });
}); 