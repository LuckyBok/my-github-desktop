'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { IncomeData } from './IncomeForm';

interface IncomeRecord extends Omit<IncomeData, 'date'> {
  id: string;
  date: Timestamp;
}

interface OrganizationTotal {
  name: string;
  total: number;
}

interface MonthlyIncome {
  month: string;
  amount: number;
}

// Chart colors
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FF6B6B', '#6C8EBF', '#B576AD', '#67B7DC'
];

export default function IncomeAnalytics() {
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  
  // Analytics data
  const [totalIncome, setTotalIncome] = useState(0);
  const [avgIncome, setAvgIncome] = useState(0);
  const [topOrganizations, setTopOrganizations] = useState<OrganizationTotal[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyIncome[]>([]);

  // Fetch data and calculate analytics
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const q = query(collection(db, 'income'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const records: IncomeRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<IncomeRecord, 'id'>;
          records.push({ id: doc.id, ...data });
        });
        
        setIncomeRecords(records);
        calculateAnalytics(records);
      } catch (err) {
        console.error('Error fetching income data:', err);
        setError('Failed to load income data for analytics.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAdmin]);
  
  // Calculate analytics from records
  const calculateAnalytics = (records: IncomeRecord[]) => {
    if (records.length === 0) {
      setTotalIncome(0);
      setAvgIncome(0);
      setTopOrganizations([]);
      setMonthlyData([]);
      return;
    }
    
    // Calculate total income
    const total = records.reduce((sum, record) => sum + record.incomeAmount, 0);
    setTotalIncome(total);
    
    // Calculate average income per project
    setAvgIncome(total / records.length);
    
    // Calculate income by organization
    const orgIncomeMap = new Map<string, number>();
    records.forEach(record => {
      const org = record.organization;
      orgIncomeMap.set(org, (orgIncomeMap.get(org) || 0) + record.incomeAmount);
    });
    
    // Sort organizations by income (descending)
    const sortedOrgs = Array.from(orgIncomeMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
    
    // Keep top 5 organizations
    setTopOrganizations(sortedOrgs.slice(0, 5));
    
    // Calculate monthly income for the last 6 months
    const monthlyIncomeMap = new Map<string, number>();
    const today = new Date();
    
    // Initialize the last 6 months with 0 values
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyIncomeMap.set(monthKey, 0);
    }
    
    // Fill in actual values
    records.forEach(record => {
      const recordDate = record.date.toDate();
      const monthKey = recordDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      // Only count the last 6 months
      if (monthlyIncomeMap.has(monthKey)) {
        monthlyIncomeMap.set(monthKey, (monthlyIncomeMap.get(monthKey) || 0) + record.incomeAmount);
      }
    });
    
    // Convert to array for charting (in chronological order)
    const monthlyIncome = Array.from(monthlyIncomeMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .reverse();
    
    setMonthlyData(monthlyIncome);
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Custom tooltip for pie chart
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 shadow rounded border border-gray-200 dark:border-gray-700">
          <p className="text-sm">{payload[0].name}: {formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Only show to admins
  if (!isAdmin) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading analytics...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Total Revenue
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalIncome)}
            </dd>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Average Revenue per Project
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(avgIncome)}
            </dd>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Total Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {incomeRecords.length}
            </dd>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Revenue</h3>
          {monthlyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="month"
                    className="text-xs fill-gray-500 dark:fill-gray-400" 
                  />
                  <YAxis 
                    className="text-xs fill-gray-500 dark:fill-gray-400"
                    tickFormatter={tick => formatCurrency(tick).replace('.00', '')}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: '#e2e8f0',
                      color: '#1f2937',
                      borderRadius: '0.375rem'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Monthly Revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No monthly data available</p>
            </div>
          )}
        </div>
        
        {/* Top Organizations Chart */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Revenue Sources</h3>
          {topOrganizations.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topOrganizations}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {topOrganizations.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No organization data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 