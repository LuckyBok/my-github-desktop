'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';
import { seedTemplates } from '@/lib/seedData';
import dynamic from 'next/dynamic';

// Dynamically import the PDF component to avoid SSR issues with @react-pdf/renderer
const DownloadPortfolioPDF = dynamic(
  () => import('@/components/PortfolioPDF'),
  { ssr: false }
);

// Define types
interface ProfileData {
  name: string;
  tagline: string;
  bio: string;
  imageUrl: string;
  email?: string;
  phone?: string;
  website?: string;
}

interface FileData {
  id: string;
  fileName: string;
  fileType: string;
  downloadURL: string;
  categoryId: string;
  uploadedAt: any;
  organization?: string;
}

interface TemplateData {
  id: string;
  title: string;
  description: string;
  fileType: string;
  downloadURL: string;
  price?: string;
  tags?: string[];
  uploadedAt: any;
}

interface LectureRequest {
  id?: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt?: any;
}

interface IncomeData {
  id: string;
  incomeAmount: number;
  organization?: string;
  date: any;
}

interface MetricData {
  totalFiles: number;
  totalOrganizations: number;
  totalIncome: number;
  categories: {
    [key: string]: number;
  };
}

interface GrowthData {
  year: number;
  lectures: number;
  income: number;
}

export default function PortfolioPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [metrics, setMetrics] = useState<MetricData>({
    totalFiles: 0,
    totalOrganizations: 0,
    totalIncome: 0,
    categories: {}
  });
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [featuredFiles, setFeaturedFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for Template Market and Lecture Request
  const [activeTab, setActiveTab] = useState<'templates' | 'requests'>('templates');
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [requestForm, setRequestForm] = useState<LectureRequest>({
    name: '',
    email: '',
    topic: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch instructor profile
        const profileSnapshot = await getDoc(doc(db, 'instructorProfile', 'main'));
        if (profileSnapshot.exists()) {
          setProfile(profileSnapshot.data() as ProfileData);
        }

        // Fetch files data
        const filesSnapshot = await getDocs(collection(db, 'files'));
        const filesData = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FileData[];

        // Fetch featured/recent files
        const featuredFilesQuery = query(
          collection(db, 'files'),
          orderBy('uploadedAt', 'desc'),
          limit(3)
        );
        const featuredSnapshot = await getDocs(featuredFilesQuery);
        setFeaturedFiles(featuredSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FileData[]);

        // Fetch templates
        const templatesQuery = query(
          collection(db, 'templates'),
          orderBy('uploadedAt', 'desc')
        );
        const templatesSnapshot = await getDocs(templatesQuery);
        const templatesData = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TemplateData[];
        
        // Use seed data if no templates are found in Firestore
        setTemplates(templatesData.length > 0 ? templatesData : seedTemplates);

        // Fetch income data
        const incomeSnapshot = await getDocs(collection(db, 'income'));
        const incomeData = incomeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IncomeData[];
        
        // Calculate metrics
        const organizations = new Set([
          ...filesData.map(file => file.organization).filter(Boolean),
          ...incomeData.map(income => income.organization).filter(Boolean)
        ]);
        
        const totalIncome = incomeData.reduce((sum, income) => sum + (income.incomeAmount || 0), 0);
        
        // Count files by category
        const categories: {[key: string]: number} = {};
        filesData.forEach(file => {
          const categoryId = file.categoryId || 'uncategorized';
          categories[categoryId] = (categories[categoryId] || 0) + 1;
        });
        
        setMetrics({
          totalFiles: filesData.length,
          totalOrganizations: organizations.size,
          totalIncome,
          categories
        });

        // Calculate growth data
        const yearData = new Map<number, {
          lectures: number;
          income: number;
        }>();

        // Process files data for growth
        filesData.forEach(file => {
          const uploadDate = file.uploadedAt?.toDate?.() || new Date();
          const year = uploadDate.getFullYear();
          
          if (!yearData.has(year)) {
            yearData.set(year, { lectures: 0, income: 0 });
          }
          
          const yearStats = yearData.get(year)!;
          yearStats.lectures += 1;
        });

        // Process income data for growth
        incomeData.forEach(income => {
          let date: Date;
          
          if (income.date?.toDate) {
            date = income.date.toDate();
          } else {
            date = new Date(income.date || Date.now());
          }
          
          const year = date.getFullYear();
          
          if (!yearData.has(year)) {
            yearData.set(year, { lectures: 0, income: 0 });
          }
          
          const yearStats = yearData.get(year)!;
          yearStats.income += income.incomeAmount || 0;
        });

        // Convert to array and sort by year
        const growthArray = Array.from(yearData.entries()).map(([year, data]) => ({
          year,
          lectures: data.lectures,
          income: data.income
        }));
        
        growthArray.sort((a, b) => a.year - b.year);
        setGrowthData(growthArray);

      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle lecture request submission
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!requestForm.name || !requestForm.email || !requestForm.topic || !requestForm.message) {
      setSubmitError('All fields are required');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Add to Firestore
      await addDoc(collection(db, 'requests'), {
        ...requestForm,
        createdAt: serverTimestamp()
      });
      
      // Show success message and reset form
      setSubmitSuccess(true);
      setRequestForm({
        name: '',
        email: '',
        topic: '',
        message: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitError('Failed to submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="mb-8">
        <Link href="/" className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Profile Image */}
          <div className="relative h-48 w-48 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-md">
            {profile?.imageUrl ? (
              <img 
                src={profile.imageUrl} 
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Profile Information */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {profile?.name || 'Instructor Name'}
            </h1>
            <p className="text-xl text-blue-600 dark:text-blue-400 font-medium mt-2">
              {profile?.tagline || 'Professional Instructor'}
            </p>
            
            <div className="mt-6 text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {profile?.bio || 'No bio information available.'}
            </div>
            
            {/* Contact Information */}
            <div className="mt-6 space-y-2">
              {profile?.email && (
                <div className="flex items-center justify-center md:justify-start text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{profile.email}</span>
                </div>
              )}
              
              {profile?.phone && (
                <div className="flex items-center justify-center md:justify-start text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{profile.phone}</span>
                </div>
              )}
              
              {profile?.website && (
                <div className="flex items-center justify-center md:justify-start text-blue-600 dark:text-blue-400 hover:underline">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a>
                </div>
              )}
            </div>
            
            {/* Add the download portfolio button */}
            <div className="mt-8 flex justify-center md:justify-start">
              {typeof window !== 'undefined' && (
                <DownloadPortfolioPDF 
                  profile={profile || {
                    name: 'Instructor',
                    tagline: 'Professional Instructor',
                    bio: '',
                    imageUrl: ''
                  }}
                  metrics={metrics}
                  growthData={growthData}
                  templates={templates}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Key Statistics */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Key Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 flex items-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mr-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalFiles}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 flex items-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mr-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Organizations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalOrganizations}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 flex items-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mr-4">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalIncome)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Charts */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Growth Over Time</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lectures Growth Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Lectures Created
            </h3>
            <div className="h-64">
              {growthData.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">No growth data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Income Growth Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Revenue Growth
            </h3>
            <div className="h-64">
              {growthData.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">No revenue data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Files */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Content</h2>
        
        {featuredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFiles.map(file => (
              <div 
                key={file.id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1">
                  {/* File Icon based on type */}
                  <div className="mb-4 text-center">
                    {file.fileType.startsWith('image/') ? (
                      <span className="text-4xl">🖼️</span>
                    ) : file.fileType.includes('pdf') ? (
                      <span className="text-4xl">📄</span>
                    ) : file.fileType.includes('word') ? (
                      <span className="text-4xl">📝</span>
                    ) : file.fileType.includes('excel') || file.fileType.includes('sheet') ? (
                      <span className="text-4xl">📊</span>
                    ) : (
                      <span className="text-4xl">📁</span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2 truncate">
                    {file.fileName}
                  </h3>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {file.uploadedAt?.toDate ? 
                      new Date(file.uploadedAt.toDate()).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      }) : 'Date unavailable'
                    }
                  </p>
                </div>
                
                <div className="px-6 pb-6">
                  <a 
                    href={file.downloadURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-center font-medium rounded-md transition duration-150 ease-in-out"
                  >
                    View File
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <p className="text-gray-500 dark:text-gray-400">No featured files available</p>
          </div>
        )}
      </section>
      
      {/* Template Market and Lecture Request */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Resources & Contact</h2>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'templates'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            My Templates
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              activeTab === 'requests'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Lecture Request
          </button>
        </div>

        {/* Templates Tab Content */}
        {activeTab === 'templates' && (
          <>
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map(template => (
                  <div 
                    key={template.id} 
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col"
                  >
                    <div className="p-6 flex-1">
                      {/* File Icon based on type */}
                      <div className="mb-4 text-center">
                        {template.fileType.includes('pdf') ? (
                          <span className="text-4xl">📄</span>
                        ) : template.fileType.includes('zip') ? (
                          <span className="text-4xl">📦</span>
                        ) : template.fileType.includes('word') ? (
                          <span className="text-4xl">📝</span>
                        ) : template.fileType.includes('excel') || template.fileType.includes('sheet') ? (
                          <span className="text-4xl">📊</span>
                        ) : (
                          <span className="text-4xl">📁</span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2 truncate">
                        {template.title}
                      </h3>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                        {template.description}
                      </p>
                      
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                          {template.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {template.price && (
                        <p className="text-center font-medium text-green-600 dark:text-green-400 mb-2">
                          {template.price === 'Free' ? 'Free' : `$${template.price}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="px-6 pb-6">
                      <a 
                        href={template.downloadURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-center font-medium rounded-md transition duration-150 ease-in-out"
                      >
                        Download Template
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-gray-500 dark:text-gray-400">No templates available yet</p>
              </div>
            )}
          </>
        )}

        {/* Lecture Request Tab Content */}
        {activeTab === 'requests' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Request a Custom Lecture
            </h3>
            
            {submitSuccess ? (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Thank you! Your lecture request has been submitted successfully. We'll be in touch soon.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                {submitError && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">{submitError}</p>
                  </div>
                )}
              
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={requestForm.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={requestForm.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lecture Topic
                  </label>
                  <input
                    type="text"
                    id="topic"
                    name="topic"
                    value={requestForm.topic}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                    placeholder="e.g. Advanced React Patterns"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={requestForm.message}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                    placeholder="Please provide any specific requirements or questions about the lecture you're requesting"
                    required
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
      
      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
        <p>© {new Date().getFullYear()} {profile?.name || 'Instructor'}. All rights reserved.</p>
      </footer>
    </div>
  );
} 