'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReportSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  deliveryTime: string;
  emailAddress: string;
  enabled: boolean;
}

export default function ReportScheduler() {
  const [settings, setSettings] = useState<ReportSettings>({
    frequency: 'weekly',
    deliveryTime: '09:00',
    emailAddress: '',
    enabled: false
  });
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate time options in 30-min increments
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const ampm = hour < 12 ? 'AM' : 'PM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return {
      value: `${hour.toString().padStart(2, '0')}:${minute}`,
      label: `${hour12}:${minute} ${ampm}`
    };
  });

  useEffect(() => {
    // Fetch existing settings from Firestore
    async function fetchSettings() {
      try {
        setLoadingSettings(true);
        const settingsDoc = await getDoc(doc(db, 'reportSettings', 'automation'));
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as ReportSettings;
          setSettings(data);
        }
      } catch (err) {
        console.error('Error fetching report settings:', err);
        setError('Failed to load current report settings');
      } finally {
        setLoadingSettings(false);
      }
    }
    
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleEnable = () => {
    setSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!settings.emailAddress) {
      setError('Email address is required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Save settings to Firestore
      await setDoc(doc(db, 'reportSettings', 'automation'), settings);
      
      setSuccess('Report automation settings saved successfully');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving report settings:', err);
      setError('Failed to save report settings');
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Report Automation Settings
      </h3>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-3 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-3 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}
      
      <div className="flex items-center mb-6">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Automatic Report Delivery
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enable to automatically send portfolio reports via email based on schedule
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleToggleEnable}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-pressed={settings.enabled}
          >
            <span className="sr-only">Enable automatic reports</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={settings.frequency}
              onChange={handleInputChange}
              disabled={!settings.enabled}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 dark:disabled:bg-gray-700 dark:text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (Sunday)</option>
              <option value="monthly">Monthly (1st day)</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Delivery Time
            </label>
            <select
              id="deliveryTime"
              name="deliveryTime"
              value={settings.deliveryTime}
              onChange={handleInputChange}
              disabled={!settings.enabled}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 dark:disabled:bg-gray-700 dark:text-white"
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Delivery Email Address
          </label>
          <input
            type="email"
            id="emailAddress"
            name="emailAddress"
            value={settings.emailAddress}
            onChange={handleInputChange}
            disabled={!settings.enabled}
            placeholder="email@example.com"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70 dark:disabled:bg-gray-700 dark:text-white"
            required={settings.enabled}
          />
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving || !settings.enabled}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:hover:bg-blue-600"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 