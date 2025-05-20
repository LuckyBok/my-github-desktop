# Admin Dashboard Project

A Next.js 13+ dashboard application with App Router, Firebase Auth, and Firestore integration.

## Features

- **Firebase Authentication**: Admin login with role-based access control
- **Firestore Database**: Store and retrieve file and income data
- **PDF Export**: Client-side PDF generation with `@react-pdf/renderer`
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Modular Architecture**: Component-based design with reusable building blocks
- **Accessibility**: ARIA-compliant interfaces with keyboard navigation

## Project Structure

```
src/
├── components/
│   ├── AdminDashboard.tsx               # Main dashboard component
│   ├── ui/                              # Reusable UI components
│   │   ├── DashboardCard.tsx            # Card container component
│   │   ├── ErrorAlert.tsx               # Error message component
│   │   ├── LoadingSpinner.tsx           # Loading indicator
│   │   └── TabGroup.tsx                 # Accessible tab interface
│   ├── instructor/                      # Instructor-specific components
│   │   ├── InstructorBranding.tsx       # Container for instructor modules
│   │   ├── InstructorGrowth.tsx         # Growth metrics visualizations 
│   │   └── InstructorProfile.tsx        # Profile management interface
│   ├── dashboard/
│   │   ├── types.ts                     # Shared TypeScript types
│   │   ├── DashboardTab.tsx             # Tab component
│   │   ├── sections/                    # Dashboard section components
│   │   │   ├── ActivityLogs.tsx         # Activity logs section
│   │   │   ├── SettingsPanel.tsx        # Settings section
│   │   │   └── UserManagement.tsx       # User management section
├── hooks/                               # Custom React hooks
│   ├── useFirebaseDoc.ts                # Firestore document hook
│   └── useSectionToggle.ts              # Section toggle hook with reducer
├── lib/
│   └── firebase.ts                      # Firebase configuration
├── context/
│   └── AuthContext.tsx                  # Authentication context
```

## Reusable Components

### UI Components

- **DashboardCard**: Container with consistent styling for dashboard sections
  ```tsx
  <DashboardCard 
    title="My Section" 
    description="Optional description text"
    testId="my-section"
  >
    {/* Content */}
  </DashboardCard>
  ```

- **TabGroup**: Accessible tab interface with ARIA attributes
  ```tsx
  <TabGroup 
    tabs={[
      { 
        id: 'tab1', 
        label: 'First Tab', 
        content: <MyComponent /> 
      },
      // Additional tabs...
    ]} 
    activeTab="tab1"
    onChange={(tabId) => console.log(`Tab changed to ${tabId}`)}
  />
  ```

- **LoadingSpinner**: Customizable loading indicator
  ```tsx
  <LoadingSpinner 
    message="Loading content..." 
    size="md" 
    testId="content-loader"
  />
  ```

- **ErrorAlert**: Standardized error display
  ```tsx
  <ErrorAlert 
    message="An error occurred while fetching data" 
    testId="fetch-error"
  />
  ```

### Custom Hooks

- **useFirebaseDoc**: Hook for fetching and updating Firestore documents
  ```tsx
  const { data, loading, error, updateDoc } = useFirebaseDoc<UserProfile>({
    collectionName: 'users',
    docId: 'user123',
    disabled: !isLoggedIn
  });
  ```

- **useSectionToggle**: Hook for managing section toggle state
  ```tsx
  const { activeSection, setActiveSection, hideAll } = useSectionToggle<'section1' | 'section2'>('section1');
  ```

## Hydration Strategy

To avoid hydration mismatches, this project uses:

1. **Dynamic Imports**: Components with client-side logic use `dynamic` import with `ssr: false`
   ```tsx
   const ClientComponent = dynamic(() => import('./ClientComponent'), { ssr: false });
   ```

2. **Client Directives**: `'use client'` directive marks client-side entry points

3. **Mount Checks**: Components check for client-side mounting before rendering sensitive content
   ```tsx
   const [isMounted, setIsMounted] = useState(false);
   useEffect(() => { setIsMounted(true); }, []);
   if (!isMounted) return <LoadingSpinner />;
   ```

## Running the Project

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd my-github-desktop
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up Firebase configuration
   Create a `.env.local` file with your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing

Run tests using Jest and React Testing Library:

```bash
npm test
```

## Extending the Dashboard

To add a new section to the dashboard:

1. Create a new component in `src/components/dashboard/sections/`
2. Add the section ID to the `SectionId` type in `types.ts`
3. Add the section to the `dashboardSections` array in `AdminDashboard.tsx`
4. Add a case in the `renderActiveSection` function

## Accessibility Features

- **ARIA Attributes**: Proper roles and relationships for complex components
- **Keyboard Navigation**: Tab focus and key handlers for interactive elements
- **Focus Management**: Visible focus indicators and logical tab order
- **Semantic HTML**: Using appropriate HTML elements for their semantic meaning
- **Color Contrast**: Ensuring text meets WCAG contrast requirements
