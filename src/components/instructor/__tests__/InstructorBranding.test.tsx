import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import InstructorBranding from '../InstructorBranding';
import { useAuth } from '@/context/AuthContext';

// Mock dependencies
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the dynamically imported components
jest.mock('../InstructorProfile', () => () => <div data-testid="instructor-profile">Profile Content</div>);
jest.mock('../InstructorGrowth', () => () => <div data-testid="instructor-growth">Growth Content</div>);

// Mock Next.js dynamic import
jest.mock('next/dynamic', () => (func) => {
  const component = func();
  component.displayName = 'DynamicComponent';
  return component;
});

describe('InstructorBranding', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders nothing when user is not admin', () => {
    // Mock non-admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: false,
    });

    const { container } = render(<InstructorBranding />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders tabs and profile content by default for admin users', async () => {
    // Mock admin user
    (useAuth as jest.Mock).mockReturnValue({
      isAdmin: true,
    });

    render(<InstructorBranding />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('instructor-branding')).toBeInTheDocument();
    });

    // Check if tabs are rendered
    expect(screen.getByTestId('tab-profile')).toBeInTheDocument();
    expect(screen.getByTestId('tab-growth')).toBeInTheDocument();
    
    // Profile content should be visible by default
    expect(screen.getByTestId('panel-profile')).toBeInTheDocument();
    expect(screen.getByText('Personal Branding')).toBeInTheDocument();
  });
}); 