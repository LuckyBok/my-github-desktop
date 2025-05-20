'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { startOfWeek, endOfWeek, format } from 'date-fns';

// Define report data types
interface FileData {
  id: string;
  fileName: string;
  organization?: string;
  fileSize?: number;
  fileType?: string;
  categoryId?: string;
  downloadURL?: string;
  uploadedAt?: Timestamp;
  storagePath?: string;
  summary?: string;
  tags?: string[];
  notes?: string;
}

interface OrganizationData {
  name: string;
  count: number;
}

interface ReportData {
  dateRange: string;
  newFiles: FileData[];
  weeklyIncome: number;
  topOrganizations: OrganizationData[];
}

// Define styles for PDF
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
  }
});

// Define PDF Document component
const WeeklyReportPDF: React.FC<{ data: ReportData, generatedDate?: string }> = ({ data, generatedDate }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Weekly Admin Report</Text>
      
      <View style={styles.section}>
        <Text style={styles.heading}>Report Period: {data.dateRange}</Text>
      </View>
      
      {/* New Files Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>New Files Uploaded</Text>
        <Text style={styles.text}>Total new files: {data.newFiles.length}</Text>
        
        {data.newFiles.map((file: FileData, index: number) => (
          <View style={styles.row} key={file.id}>
            <Text style={styles.text}>
              {index + 1}. {file.fileName} ({file.organization || 'No organization'})
            </Text>
          </View>
        ))}
        
        {data.newFiles.length === 0 && (
          <Text style={styles.text}>No new files uploaded this week</Text>
        )}
      </View>
      
      {/* Weekly Income Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Weekly Income</Text>
        <Text style={[styles.text, styles.bold]}>
          Total income this week: ${data.weeklyIncome.toLocaleString()}
        </Text>
      </View>
      
      {/* Top Organizations Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Top Organizations</Text>
        
        {data.topOrganizations.map((org: OrganizationData, index: number) => (
          <View style={styles.row} key={org.name}>
            <Text style={styles.text}>
              {index + 1}. {org.name}: {org.count} files
            </Text>
          </View>
        ))}
        
        {data.topOrganizations.length === 0 && (
          <Text style={styles.text}>No organizations found</Text>
        )}
      </View>
      
      <Text style={[styles.text, { marginTop: 20 }]}>
        Report generated on {generatedDate || 'N/A'}
      </Text>
    </Page>
  </Document>
);

export default function WeeklyReportGenerator() {
  const { isAdmin } = useAuth();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  const [formattedDisplayDate, setFormattedDisplayDate] = useState('');

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setFormattedDate(format(now, 'yyyy-MM-dd'));
    setFormattedDisplayDate(format(now, 'MMMM d, yyyy'));
  }, []);

  // Function to generate the report data
  const generateReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // Define the date range for this week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday as start of week
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      
      // Format date range for display
      const dateRange = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      
      // Query for new files uploaded this week
      const filesQuery = query(
        collection(db, 'files'),
        where('uploadedAt', '>=', Timestamp.fromDate(weekStart)),
        where('uploadedAt', '<=', Timestamp.fromDate(weekEnd))
      );
      
      const filesSnapshot = await getDocs(filesQuery);
      const newFiles = filesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fileName: doc.data().fileName || 'Unnamed File',
        organization: doc.data().organization || 'Unspecified'
      })) as FileData[];
      
      // Query for income this week
      const incomeQuery = query(
        collection(db, 'income'),
        where('date', '>=', Timestamp.fromDate(weekStart)),
        where('date', '<=', Timestamp.fromDate(weekEnd))
      );
      
      const incomeSnapshot = await getDocs(incomeQuery);
      const weeklyIncome = incomeSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().incomeAmount || 0);
      }, 0);
      
      // Calculate top organizations
      const orgCounts: Record<string, number> = {};
      
      // Count organizations from all files
      const allFilesSnapshot = await getDocs(collection(db, 'files'));
      allFilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const org = data.organization || 'Unspecified';
        orgCounts[org] = (orgCounts[org] || 0) + 1;
      });
      
      // Convert to array and sort
      const topOrganizations = Object.entries(orgCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Set the report data
      const data: ReportData = {
        dateRange,
        newFiles,
        weeklyIncome,
        topOrganizations
      };
      
      setReportData(data);
      setSuccessMessage('Report generated successfully. You can now download it or send via email.');
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to manually send the report via email using Firebase Function
  const sendReportEmail = async () => {
    if (!adminEmail || !reportData) return;
    
    try {
      setSending(true);
      setError(null);
      
      // Call the Firebase Function
      const functions = getFunctions();
      const sendWeeklyReportManually = httpsCallable(functions, 'sendWeeklyReportManually');
      
      // Send the report data and admin email to the function
      const result = await sendWeeklyReportManually({
        adminEmail,
        reportData
      });
      
      setSuccessMessage(`Report sent successfully to ${adminEmail}`);
    } catch (err) {
      console.error('Error sending report:', err);
      setError('Failed to send report email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Report Generator</h2>
      </div>

      {/* Generator Controls */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Generate Weekly Summary Report</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate a report with new files, income, and top organizations from the past week.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={generateReportData}
              disabled={loading}
              className={`px-4 py-2 rounded-md shadow-sm text-white ${
                loading
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
              }`}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            
            {reportData && (
              <PDFDownloadLink
                document={<WeeklyReportPDF data={reportData} generatedDate={formattedDisplayDate} />}
                fileName={`weekly-report-${formattedDate}.pdf`}
                className="px-4 py-2 rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
              >
                {({ loading: pdfLoading }) => (pdfLoading ? 'Preparing PDF...' : 'Download PDF')}
              </PDFDownloadLink>
            )}
          </div>
          
          {/* Email Sending Form */}
          {reportData && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                Send Report via Email
              </h4>
              
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Admin email address"
                  className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                
                <button
                  onClick={sendReportEmail}
                  disabled={sending || !adminEmail}
                  className={`px-4 py-2 rounded-md shadow-sm text-white ${
                    sending || !adminEmail
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
                  }`}
                >
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
              
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                The report will be sent as a PDF attachment to the specified email address.
              </p>
            </div>
          )}
          
          {/* Status Messages */}
          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mt-4 p-3 rounded-md bg-green-50 dark:bg-green-900/30">
              <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Report Preview */}
      {reportData && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Report Preview</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Report Period</h4>
              <p className="text-gray-600 dark:text-gray-400">{reportData.dateRange}</p>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">New Files ({reportData.newFiles.length})</h4>
              {reportData.newFiles.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {reportData.newFiles.map((file) => (
                    <li key={file.id} className="text-gray-600 dark:text-gray-400">
                      {file.fileName} ({file.organization})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No new files uploaded this week</p>
              )}
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Weekly Income</h4>
              <p className="text-gray-600 dark:text-gray-400">
                ${reportData.weeklyIncome.toLocaleString()}
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Top Organizations</h4>
              {reportData.topOrganizations.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {reportData.topOrganizations.map((org, index) => (
                    <li key={org.name} className="text-gray-600 dark:text-gray-400">
                      {index + 1}. {org.name}: {org.count} files
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No organizations found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 