'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define module statuses
const modules = [
  { name: 'Authentication', status: true, description: 'Secure admin login with email/password' },
  { name: 'File Upload', status: true, description: 'Upload files with metadata and categories' },
  { name: 'File Management', status: true, description: 'View, filter, and delete files' },
  { name: 'Dark Mode', status: true, description: 'Toggle between light and dark themes' },
  { name: 'CSV Export', status: true, description: 'Export file metadata as CSV' },
  { name: 'ZIP Download', status: true, description: 'Download all files as ZIP archive' },
  { name: 'Revenue Tracking', status: true, description: 'Record and analyze income data' },
  { name: 'ROI Analysis', status: true, description: 'Visualize revenue metrics and growth' },
  { name: 'Profile Management', status: true, description: 'Customize instructor profile and branding' },
  { name: 'AI Metadata', status: true, description: 'Generate file tags and summaries using AI' }
];

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#fff'
  },
  section: {
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid',
    paddingVertical: 5
  },
  col1: {
    flex: 1
  },
  col2: {
    width: 100,
    textAlign: 'right'
  },
  text: {
    fontSize: 12,
    marginBottom: 5
  },
  bold: {
    fontWeight: 'bold'
  },
  profileContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center'
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10
  },
  profileInfo: {
    flex: 1
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  statBox: {
    width: '50%',
    padding: 5
  }
});

// Define PDF Document component
const ProjectPDF = ({ stats, profile, modules }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>File Manager Project Summary</Text>
      
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Instructor Profile</Text>
        <View style={styles.profileContainer}>
          {profile?.imageUrl && (
            <Image src={profile.imageUrl} style={styles.profileImage} />
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.text, styles.bold]}>{profile?.name || 'Instructor Name'}</Text>
            <Text style={styles.text}>{profile?.tagline || 'Instructor Tagline'}</Text>
          </View>
        </View>
      </View>
      
      {/* Stats Summary */}
      <View style={styles.section}>
        <Text style={styles.heading}>Project Statistics</Text>
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.text, styles.bold]}>Total Files:</Text>
            <Text style={styles.text}>{stats.totalFiles}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.text, styles.bold]}>Categories:</Text>
            <Text style={styles.text}>{stats.totalCategories}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.text, styles.bold]}>Organizations:</Text>
            <Text style={styles.text}>{stats.totalOrganizations}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.text, styles.bold]}>Total Revenue:</Text>
            <Text style={styles.text}>${stats.totalIncome.toLocaleString()}</Text>
          </View>
        </View>
      </View>
      
      {/* Modules List */}
      <View style={styles.section}>
        <Text style={styles.heading}>Implemented Features</Text>
        {modules.map((module, index) => (
          <View style={styles.row} key={index}>
            <Text style={[styles.text, styles.col1]}>
              {module.name} - {module.description}
            </Text>
            <Text style={[styles.text, styles.col2]}>
              {module.status ? '✅ Complete' : '⏳ In Progress'}
            </Text>
          </View>
        ))}
      </View>
      
      <Text style={[styles.text, { marginTop: 20 }]}>
        Report generated on {new Date().toLocaleDateString()}
      </Text>
    </Page>
  </Document>
);

export default function ProjectSummaryReport() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalCategories: 0,
    totalOrganizations: 0,
    totalIncome: 0
  });
  const [profile, setProfile] = useState<any>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [incomeData, setIncomeData] = useState<any[]>([]);

  // Fetch all necessary data
  useEffect(() => {
    if (!isAdmin) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch files data
        const filesSnapshot = await getDocs(collection(db, 'files'));
        const filesData = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFileData(filesData);
        
        // Fetch income data
        const incomeSnapshot = await getDocs(collection(db, 'income'));
        const incomeData = incomeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIncomeData(incomeData);
        
        // Fetch profile data
        const profileSnapshot = await getDoc(doc(db, 'instructorProfile', 'main'));
        if (profileSnapshot.exists()) {
          setProfile(profileSnapshot.data());
        }
        
        // Calculate statistics
        const categories = new Set(filesData.map(file => file.categoryId).filter(Boolean));
        const organizations = new Set([
          ...filesData.map(file => file.organization).filter(Boolean),
          ...incomeData.map(income => income.organization).filter(Boolean)
        ]);
        
        const totalIncome = incomeData.reduce((sum, income) => sum + (income.incomeAmount || 0), 0);
        
        setStats({
          totalFiles: filesData.length,
          totalCategories: categories.size,
          totalOrganizations: organizations.size,
          totalIncome
        });
        
      } catch (err) {
        console.error('Error fetching summary data:', err);
        setError('Failed to load project summary data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isAdmin]);

  // Generate JSON data for export
  const generateJsonData = () => {
    const jsonData = {
      stats,
      profile,
      files: fileData,
      income: incomeData,
      modules,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileName = `file-manager-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading project summary...</p>
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Summary Report</h2>
        <div className="mt-4 md:mt-0 flex space-x-3">
          {/* JSON Export Button */}
          <button
            onClick={generateJsonData}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export as JSON
          </button>
          
          {/* PDF Export Button */}
          <PDFDownloadLink
            document={<ProjectPDF stats={stats} profile={profile} modules={modules} />}
            fileName={`file-manager-report-${new Date().toISOString().split('T')[0]}.pdf`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {({ loading }) => (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                {loading ? 'Generating PDF...' : 'Export as PDF'}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>
      
      {/* Profile Summary */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Instructor Profile</h3>
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Profile Image */}
          <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md">
            {profile?.imageUrl ? (
              <img 
                src={profile.imageUrl} 
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Profile Information */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {profile?.name || 'Add Your Name'}
            </h3>
            <p className="text-md text-blue-600 dark:text-blue-400">
              {profile?.tagline || 'Add a professional tagline'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Key Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Files</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalFiles}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCategories}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organizations</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalOrganizations}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
            ${stats.totalIncome.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Module Status List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Implemented Features</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Current status of project modules and features.
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl>
            {modules.map((module, index) => (
              <div 
                key={module.name} 
                className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-850' : 'bg-white dark:bg-gray-800'} px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
              >
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {module.name}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 sm:col-span-1">
                  {module.description}
                </dd>
                <dd className="mt-1 text-sm text-right sm:mt-0 sm:col-span-1">
                  {module.status ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      ✅ Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      ⏳ In Progress
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Report generated on {new Date().toLocaleDateString()}
      </div>
    </div>
  );
} 