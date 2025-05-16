'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import FileUploader from '@/components/FileUploader';
import FileList from '@/components/FileList';

export default function TestUploadPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [lastUploadedFile, setLastUploadedFile] = useState<{url: string, metadata: any} | null>(null);

  const handleUploadComplete = (fileUrl: string, metadata: any) => {
    setLastUploadedFile({ url: fileUrl, metadata });
    setSelectedCategoryId(metadata.categoryId);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    alert(`Upload failed: ${error.message}`);
  };

  return (
    <AuthProvider>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">File Upload Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* File Uploader Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
            <FileUploader 
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />
          </div>
          
          {/* File List Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedCategoryId 
                ? `Showing files from selected category` 
                : `Showing all files`}
            </p>
            <FileList 
              categoryId={selectedCategoryId || undefined} 
              className="mt-4"
            />
          </div>
        </div>
        
        {/* Last Uploaded File */}
        {lastUploadedFile && (
          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
              File Uploaded Successfully
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              File: <strong>{lastUploadedFile.metadata.fileName}</strong>
            </p>
            <div className="mt-2">
              <a 
                href={lastUploadedFile.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                View File
              </a>
            </div>
          </div>
        )}
      </div>
    </AuthProvider>
  );
} 