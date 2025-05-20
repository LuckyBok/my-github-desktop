'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { ref, getBlob } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
// @ts-ignore - Add this to suppress JSZip type errors until you install the package
import JSZip from 'jszip';

// Note: To use this component, install JSZip with:
// npm install jszip
// npm install --save-dev @types/jszip

interface FileMetadata {
  fileName: string;
  fileSize: number;
  downloadURL: string;
  storagePath?: string;
  categoryId: string;
}

export default function DownloadAllFiles() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [timestamp, setTimestamp] = useState('');
  const { user } = useAuth();

  // Get admin status from AuthContext
  const { isAdmin } = useAuth();
  
  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
    // Generate timestamp in a safe way
    const date = new Date();
    setTimestamp(date.toISOString().replace(/[:.]/g, '-'));
  }, []);

  const downloadAllFiles = async () => {
    if (!isAdmin) {
      setError('You do not have permission to download all files');
      return;
    }

    try {
      setIsLoading(true);
      setProgress(0);
      setError(null);
      setSuccess(false);

      // Step 1: Fetch all file metadata from Firestore
      const filesSnapshot = await getDocs(collection(db, 'files'));
      const filesData = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (FileMetadata & { id: string })[];
      
      if (filesData.length === 0) {
        setError('No files found in the database');
        setIsLoading(false);
        return;
      }

      // Step 2: Create a new ZIP file
      const zip = new JSZip();
      let completed = 0;

      // Step 3: Download each file and add to ZIP
      for (const fileData of filesData) {
        try {
          // Use storagePath if available, otherwise construct from categoryId and fileName
          const filePath = fileData.storagePath || `files/${fileData.categoryId}/${fileData.fileName}`;
          const fileRef = ref(storage, filePath);
          
          // Get the file blob
          const blob = await getBlob(fileRef);
          
          // Add file to zip with a folder structure based on categoryId
          zip.file(`${fileData.categoryId}/${fileData.fileName}`, blob);
          
          // Update progress
          completed++;
          const newProgress = Math.round((completed / filesData.length) * 100);
          setProgress(newProgress);
        } catch (fileError) {
          console.error(`Error downloading file ${fileData.fileName}:`, fileError);
          // Continue with other files instead of failing completely
        }
      }

      // Step 4: Generate the ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata: { percent: number }) => {
        // Update compression progress
        setProgress(Math.round(metadata.percent));
      });

      // Step 5: Create download link and trigger download
      const downloadUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      
      // Use the timestamp from state
      const currentTimestamp = isClient ? timestamp : 'download';
      downloadLink.download = `all-files-${currentTimestamp}.zip`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up URL object
      URL.revokeObjectURL(downloadUrl);
      
      // Show success message
      setSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (err) {
      console.error('Error downloading files:', err);
      setError('Failed to download files: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Only render if user is admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mt-6">
      <button
        onClick={downloadAllFiles}
        disabled={isLoading}
        className={`w-full px-4 py-3 flex items-center justify-center text-white font-medium rounded-lg
          ${isLoading
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'
          }
          transition-colors duration-200`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Downloading Files ({progress}%)
          </span>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Download All Files as ZIP
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 rounded-md bg-green-50 dark:bg-green-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                Files downloaded successfully!
              </h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Details */}
      {isLoading && progress > 0 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center">
            {progress}% complete
          </p>
        </div>
      )}
    </div>
  );
} 