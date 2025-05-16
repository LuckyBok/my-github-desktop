'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { IncomeData } from './IncomeForm';

interface IncomeRecord extends Omit<IncomeData, 'date'> {
  id: string;
  date: Timestamp;
}

export default function IncomeTable() {
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  
  // Filter states
  const [month, setMonth] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [organizations, setOrganizations] = useState<string[]>([]);

  // Fetch income records
  const fetchIncomeRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      let q = query(collection(db, 'income'), orderBy('date', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const records: IncomeRecord[] = [];
      const uniqueOrganizations = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<IncomeRecord, 'id'>;
        const record = { id: doc.id, ...data };
        records.push(record);
        
        // Collect unique organizations for filter
        if (data.organization) {
          uniqueOrganizations.add(data.organization);
        }
      });
      
      setIncomeRecords(records);
      setOrganizations(Array.from(uniqueOrganizations).sort());
    } catch (err) {
      console.error('Error fetching income records:', err);
      setError('Failed to load income records.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAdmin) {
      fetchIncomeRecords();
    }
  }, [isAdmin]);

  // Filter the records based on selected month and organization
  const filteredRecords = incomeRecords.filter((record) => {
    // Convert Firestore Timestamp to JS Date
    const recordDate = record.date.toDate();
    const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
    
    const monthMatch = !month || recordMonth === month;
    const organizationMatch = !selectedOrganization || record.organization === selectedOrganization;
    
    return monthMatch && organizationMatch;
  });
  
  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format amount for display
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Only show this component to admins
  if (!isAdmin) {
    return null;
  }

  // Generate month options - last 12 months
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = getMonthOptions();
  
  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Month Filter */}
        <div className="w-full sm:w-1/2">
          <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Month
          </label>
          <select
            id="month-filter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">All Months</option>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Organization Filter */}
        <div className="w-full sm:w-1/2">
          <label htmlFor="organization-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Organization
          </label>
          <select
            id="organization-filter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading records...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No income records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Organization
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {record.organization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      {formatAmount(record.incomeAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredRecords.length} of {incomeRecords.length} records
      </div>
    </div>
  );
} 