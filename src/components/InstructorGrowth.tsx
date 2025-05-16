'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface YearlyMetric {
  year: number;
  lectures: number;
  income: number;
  topCategory?: string;
}

interface CategoryCount {
  [category: string]: number;
}

export default function InstructorGrowth() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [growthData, setGrowthData] = useState<YearlyMetric[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    async function fetchGrowthData() {
      try {
        setLoading(true);
        setError(null);

        // Get files data for course counts
        const filesQuery = query(collection(db, 'files'));
        const filesSnapshot = await getDocs(filesQuery);
        
        // Get income data for revenue
        const incomeQuery = query(collection(db, 'income'));
        const incomeSnapshot = await getDocs(incomeQuery);
        
        // Process data by year
        const yearData = new Map<number, {
          lectures: number;
          income: number;
          categories: CategoryCount;
        }>();
        
        // Process files data (lectures)
        filesSnapshot.forEach(doc => {
          const data = doc.data();
          const uploadDate = data.uploadedAt?.toDate?.() || new Date();
          const year = uploadDate.getFullYear();
          
          if (!yearData.has(year)) {
            yearData.set(year, { lectures: 0, income: 0, categories: {} });
          }
          
          const yearStats = yearData.get(year)!;
          yearStats.lectures += 1;
          
          // Count categories
          const category = data.categoryId || 'uncategorized';
          yearStats.categories[category] = (yearStats.categories[category] || 0) + 1;
        });
        
        // Process income data
        incomeSnapshot.forEach(doc => {
          const data = doc.data();
          let date: Date;
          
          // Handle different date formats
          if (data.date instanceof Timestamp) {
            date = data.date.toDate();
          } else if (data.date?.toDate) {
            date = data.date.toDate();
          } else {
            date = new Date(data.date || Date.now());
          }
          
          const year = date.getFullYear();
          
          if (!yearData.has(year)) {
            yearData.set(year, { lectures: 0, income: 0, categories: {} });
          }
          
          const yearStats = yearData.get(year)!;
          yearStats.income += data.incomeAmount || 0;
        });
        
        // Convert to array with top categories
        const result = Array.from(yearData.entries()).map(([year, data]) => {
          // Find the top category
          let topCategory = 'None';
          let maxCount = 0;
          
          Object.entries(data.categories).forEach(([category, count]) => {
            if (count > maxCount) {
              maxCount = count;
              topCategory = category;
            }
          });
          
          return {
            year,
            lectures: data.lectures,
            income: data.income,
            topCategory
          };
        });
        
        // Sort by year
        result.sort((a, b) => a.year - b.year);
        setGrowthData(result);
      } catch (err) {
        console.error('Error fetching growth data:', err);
        setError('Failed to load growth metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchGrowthData();
  }, [isAdmin]);

  // Format for chart tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading growth metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle case with no data
  if (growthData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No growth data available yet.</p>
        <p className="mt-2 text-sm">Upload files and record income to see your growth metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline view */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Growth Timeline
        </h3>
        <div className="w-full overflow-hidden">
          <div className="relative">
            {growthData.map((data, index) => (
              <div key={data.year} className="mb-8 flex items-center">
                {/* Year bubble */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white font-bold">
                  {data.year}
                </div>
                
                {/* Line connector */}
                {index < growthData.length - 1 && (
                  <div className="absolute left-6 w-0.5 bg-blue-300 dark:bg-blue-700 h-8 transform translate-y-12 z-0"></div>
                )}
                
                {/* Stats card */}
                <div className="ml-4 flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 z-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lectures Created</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{data.lectures}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{formatCurrency(data.income)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{data.topCategory}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lectures Growth Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Lectures Created
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} lectures`, 'Lectures']} />
                <Area 
                  type="monotone" 
                  dataKey="lectures" 
                  stroke="#4F46E5" 
                  fill="#4F46E5" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Growth Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Revenue Growth
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value: any) => formatCurrency(Number(value)).replace('$', '')} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 