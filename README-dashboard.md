# Admin Dashboard Implementation

## Architecture Overview

The Admin Dashboard has been refactored to follow best practices for React applications with a focus on:

1. **Modular Components**: Each section is a separate component with clear responsibilities
2. **TypeScript Integration**: Strong typing throughout the application
3. **Testable Structure**: Components designed for easy unit and integration testing
4. **Accessibility**: Proper ARIA attributes for tab-based navigation

## Directory Structure

```
src/
├── components/
│   ├── AdminDashboard.tsx               # Main dashboard component
│   ├── dashboard/
│   │   ├── types.ts                     # Shared TypeScript types
│   │   ├── dashboardReducer.ts          # State management with useReducer
│   │   ├── DashboardTab.tsx             # Reusable tab component
│   │   ├── LoadingIndicator.tsx         # Loading state component
│   │   ├── sections/
│   │   │   ├── index.ts                 # Exports all section components
│   │   │   ├── ActivityLogs.tsx         # Activity logs section
│   │   │   ├── SettingsPanel.tsx        # Settings section
│   │   │   ├── UserManagement.tsx       # User management section
│   │   │   └── __tests__/               # Component-level tests
│   │   │       └── ActivityLogs.test.tsx
│   │   └── __tests__/                   # Dashboard-level tests
│   │       └── AdminDashboard.test.tsx
└── ...
```

## TypeScript Integration

All components are strongly typed with TypeScript:

- **Shared Types**: Common types are defined in `types.ts` and imported where needed
- **Component Props**: Each component has a properly defined props interface
- **Reducer Types**: Action types and state interfaces for the dashboard reducer
- **Discriminated Unions**: Used for action types in the reducer

## Testing Approach

The dashboard is designed for comprehensive testing:

### Testing Tools

- **Jest**: Test runner
- **React Testing Library**: Component testing
- **@testing-library/jest-dom**: DOM matchers

### Testing Strategy

1. **Unit Tests**: Test individual components in isolation
   - Test each section component independently
   - Mock dependencies and data

2. **Integration Tests**: Test component interactions
   - Test tab switching behavior
   - Test state management

3. **Component Tests**: Test component rendering and user interactions
   - Test conditional rendering
   - Test accessibility attributes

### Test Data-Attributes

All components include test data attributes for reliable test selection:

```tsx
<div data-testid="activity-logs-section">
```

## How to Add a New Section

1. Define the section ID in `types.ts`:
   ```typescript
   export type SectionId = 'fileUploader' | 'revenueTracker' | ... | 'newSection';
   ```

2. Create a new section component in `sections` directory:
   ```typescript
   // src/components/dashboard/sections/NewSection.tsx
   import { BaseSectionProps } from '../types';
   
   export interface NewSectionProps extends BaseSectionProps {
     // Add section-specific props
   }
   
   const NewSection: React.FC<NewSectionProps> = ({ testId = 'new-section' }) => {
     // Component implementation
   };
   
   export default NewSection;
   ```

3. Export the component in `sections/index.ts`:
   ```typescript
   export { default as NewSection } from './NewSection';
   ```

4. Add the section to `dashboardSections` array in `AdminDashboard.tsx`:
   ```typescript
   {
     id: 'newSection',
     label: 'New Section',
     icon: <YourIcon />,
   }
   ```

5. Add the section to the `renderActiveSection` function:
   ```typescript
   case 'newSection':
     return <NewSection testId="new-section-content" />;
   ```

6. Create tests for the new section in `sections/__tests__/NewSection.test.tsx`

## Accessibility

The dashboard is built with accessibility in mind:

- Proper tab navigation with keyboard support
- ARIA attributes for tabs and panels
- Semantic HTML structure
- Color contrast compliance
- Screen reader support

## State Management

State is managed using useReducer for better maintainability:

- **Actions**: Clearly defined action types
- **Reducer**: Pure function for state transitions
- **Initial State**: Default state with a selected tab 