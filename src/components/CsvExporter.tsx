'use client';

import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function CsvExporter() {
  const [isExporting, setIsExporting] = useState(false);

  const downloadCsv = async () => {
    try {
      setIsExporting(true);
      
      // Fetch all files from Firestore
      const filesRef = collection(db, 'files');
      const snapshot = await getDocs(filesRef);
      
      if (snapshot.empty) {
        alert('No files found to export');
        setIsExporting(false);
        return;
      }
      
      // Process data into CSV format
      const headers = ['fileName', 'categoryId', 'organization', 'fileSize', 'fileType', 'uploadedAt'];
      
      const rows = snapshot.docs.map(doc => {
        const data = doc.data();
        return [
          // Escape quotes in file names
          `"${data.fileName?.replace(/"/g, '""') || ''}"`,
          data.categoryId || '',
          // Add organization field (empty string if not present)
          `"${data.organization?.replace(/"/g, '""') || ''}"`,
          data.fileSize || 0,
          data.fileType || '',
          // Format timestamp to ISO date string if it exists
          data.uploadedAt?.toDate?.() 
            ? data.uploadedAt.toDate().toISOString() 
            : ''
        ].join(',');
      });
      
      // Assemble CSV content
      const csvContent = [
        headers.join(','),
        ...rows
      ].join('\n');
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set up download attributes
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      link.setAttribute('href', url);
      link.setAttribute('download', `files-export-${date}.csv`);
      link.style.visibility = 'hidden';
      
      // Add to document, trigger download and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={downloadCsv}
      disabled={isExporting}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm
        ${isExporting 
          ? 'bg-blue-400 text-white cursor-not-allowed dark:bg-blue-500/70' 
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:hover:bg-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800'}
      `}
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download CSV
        </>
      )}
    </button>
  );
} 