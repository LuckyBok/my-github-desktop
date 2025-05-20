/**
 * InstructorBranding component
 * 
 * Container for instructor profile and growth metrics sections
 */
'use client';

import { useAuth } from '@/context/AuthContext';
import TabGroup, { TabItem } from '../ui/TabGroup';
import DashboardCard from '../ui/DashboardCard';

// Import lazy-loaded components to avoid hydration issues
import dynamic from 'next/dynamic';

// Dynamically load instructor components
const InstructorProfile = dynamic(() => import('./InstructorProfile'), {
  ssr: false,
  loading: () => <div className="p-4">Loading profile...</div>
});

const InstructorGrowth = dynamic(() => import('./InstructorGrowth'), {
  ssr: false,
  loading: () => <div className="p-4">Loading growth metrics...</div>
});

export interface InstructorBrandingProps {
  testId?: string;
}

const InstructorBranding: React.FC<InstructorBrandingProps> = ({
  testId = 'instructor-branding'
}) => {
  const { isAdmin } = useAuth();

  // Only show to admins
  if (!isAdmin) {
    return null;
  }

  // Define tab items
  const tabItems: TabItem[] = [
    {
      id: 'profile',
      label: 'Instructor Profile',
      content: (
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Branding</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Personalize your professional profile to showcase your expertise and teaching style.
          </p>
          <InstructorProfile />
        </div>
      )
    },
    {
      id: 'growth',
      label: 'Growth Metrics',
      content: (
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Professional Growth</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Track your growth as an instructor through key metrics like lectures created and revenue generated.
          </p>
          <InstructorGrowth />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6" data-testid={testId}>
      <DashboardCard className="p-0">
        <TabGroup 
          tabs={tabItems} 
          activeTab="profile" 
          testId={`${testId}-tabs`}
        />
      </DashboardCard>
    </div>
  );
};

export default InstructorBranding; 