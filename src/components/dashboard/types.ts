// Define all section IDs
export type SectionId = 'fileUploader' | 'revenueTracker' | 'weeklyReport' | 'activityLogs' | 'userManagement' | 'settings';

// Dashboard state
export interface DashboardState {
  activeSection: SectionId | null;
}

// Dashboard actions
export type DashboardAction = 
  | { type: 'SET_ACTIVE_SECTION'; payload: SectionId }
  | { type: 'HIDE_ALL' };

// Section item interface
export interface DashboardSectionItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

// Base interface for all section components
export interface BaseSectionProps {
  testId?: string;
}

// Log entry for ActivityLogs component
export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
} 