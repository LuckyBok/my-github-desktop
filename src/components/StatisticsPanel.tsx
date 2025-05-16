'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OrganizationData {
  name: string;
  count: number;
}

export default function StatisticsPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationData[]>([]);
  
  useEffect(() => {
    async function fetchOrganizationData() {
      try {
        setLoading(true);
        setError(null);
        
        const filesRef = collection(db, 'files');
        const snapshot = await getDocs(query(filesRef));
        
        if (snapshot.empty) {
          setOrganizationData([]);
          return;
        }
        
        // Group files by organization
        const organizations = new Map<string, number>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const org = data.organization || 'Unspecified';
          
          if (organizations.has(org)) {
            organizations.set(org, organizations.get(org)! + 1);
          } else {
            organizations.set(org, 1);
          }
        });
        
        // Convert to array format for Recharts
        const chartData = Array.from(organizations.entries()).map(([name, count]) => ({
          name,
          count
        }));
        
        // Sort by count (descending)
        chartData.sort((a, b) => b.count - a.count);
        
        setOrganizationData(chartData);
      } catch (err) {
        console.error('Error fetching organization statistics:', err);
        setError('Failed to load statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrganizationData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }
  
  if (organizationData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-center">
        <p>No file organization data available yet.</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Files by Organization
      </h3>
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <ResponsiveContainer width="100%" height={organizationData.length < 5 ? 200 : Math.min(400, organizationData.length * 40)}>
          <BarChart
            layout="vertical"
            data={organizationData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120} 
              tick={{ fill: 'currentColor' }}
              className="text-gray-900 dark:text-gray-100 text-sm"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: '#e2e8f0',
                borderRadius: '0.375rem',
                color: '#1f2937'
              }} 
            />
            <Legend />
            <Bar 
              dataKey="count" 
              name="File Count" 
              fill="#3b82f6" 
              radius={[0, 4, 4, 0]} 
              className="dark:fill-blue-400"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 