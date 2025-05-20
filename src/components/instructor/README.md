# Instructor Module Components

This directory contains the refactored instructor-related components for the admin dashboard. The components follow a modular, composable pattern with TypeScript typing, proper error handling, loading states, and accessibility support.

## Components

### InstructorBranding

The main container component that provides a tabbed interface to access instructor profile management and growth metrics.

- Uses `TabGroup` for accessible tab navigation
- Dynamically imports sub-components with fallback loading states
- Consistently passes test IDs for testing

### InstructorProfile

Manages instructor profile information including:
- Profile image upload and preview
- Personal information (name, tagline, bio)
- Edit mode with form validation
- Firebase storage integration for image uploads

### InstructorGrowth

Displays growth metrics and visualizations:
- Timeline view of yearly metrics
- Charts for lectures and revenue growth
- Category distribution analysis
- Proper loading and empty states

## Shared UI Components Used

These components utilize reusable UI components from `src/components/ui/`:

- `DashboardCard`: Consistent card container with optional title/description
- `LoadingSpinner`: Loading indicator with size variants
- `ErrorAlert`: Standardized error display
- `TabGroup`: Accessible tabbed interface

## Custom Hooks Used

- `useFirebaseDoc`: Data fetching and management from Firestore
- `useSectionToggle`: Toggle state management using reducer pattern

## Integration

These components are designed to be imported dynamically into the main dashboard:

```tsx
import dynamic from 'next/dynamic';

const InstructorBranding = dynamic(
  () => import('@/components/instructor/InstructorBranding'),
  {
    ssr: false,
    loading: () => <LoadingSpinner message="Loading instructor module..." />
  }
);
```

## Accessibility Features

- ARIA roles and attributes for tab navigation
- Proper keyboard navigation support
- Semantic HTML structure
- Loading and error states with appropriate messaging
- Form elements with proper labels and descriptions 