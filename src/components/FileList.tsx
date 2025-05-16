'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

interface FileMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  categoryId: string;
  downloadURL: string;
  uploadedAt: Timestamp;
  storagePath: string;
}

interface FileListProps {
  categoryId?: string;
  className?: string;
  isAdmin?: boolean;
}

export default function FileList({ categoryId, className = '', isAdmin = false }: FileListProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Create query
    const filesRef = collection(db, 'files');
    const q = categoryId
      ? query(
          filesRef,
          where('categoryId', '==', categoryId),
          orderBy('uploadedAt', 'desc')
        )
      : query(filesRef, orderBy('uploadedAt', 'desc'));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fileList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FileMetadata[];
        setFiles(fileList);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching files:', error);
        setError('Failed to load files. Please try again.');
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [categoryId]);

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    
    const searchLower = searchTerm.toLowerCase();
    return files.filter(file => 
      file.fileName.toLowerCase().includes(searchLower)
    );
  }, [files, searchTerm]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: Timestamp): string => {
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (file: FileMetadata) => {
    if (!window.confirm(`Are you sure you want to delete "${file.fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from Storage
      const storageRef = ref(storage, file.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      const fileRef = doc(db, 'files', file.id);
      await deleteDoc(fileRef);

      setDeleteStatus({
        type: 'success',
        message: `Successfully deleted "${file.fileName}"`
      });

      // Clear status message after 3 seconds
      setTimeout(() => {
        setDeleteStatus({ type: null, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error deleting file:', error);
      setDeleteStatus({
        type: 'error',
        message: `Failed to delete "${file.fileName}". Please try again.`
      });
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-red-600 ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p>No files found{categoryId ? ' in this category' : ''}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Message */}
      {deleteStatus.type && (
        <div className={`p-4 rounded-lg ${
          deleteStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm font-medium">{deleteStatus.message}</p>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {/* Clear Button */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {/* Search Results Count */}
        {searchTerm && (
          <p className="mt-1 text-sm text-gray-500">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'} found
          </p>
        )}
      </div>

      {/* File List */}
      <div className="space-y-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-colors duration-200"
          >
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                {/* File Icon based on type */}
                <div className="flex-shrink-0">
                  {file.fileType.startsWith('image/') ? (
                    <span className="text-2xl">🖼️</span>
                  ) : file.fileType.includes('pdf') ? (
                    <span className="text-2xl">📄</span>
                  ) : file.fileType.includes('word') ? (
                    <span className="text-2xl">📝</span>
                  ) : file.fileType.includes('excel') || file.fileType.includes('sheet') ? (
                    <span className="text-2xl">📊</span>
                  ) : (
                    <span className="text-2xl">📁</span>
                  )}
                </div>
                
                {/* File Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 ml-4 flex items-center space-x-3">
              {/* Download Button */}
              <a
                href={file.downloadURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </a>

              {/* Delete Button - Only show for admin */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(file)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {searchTerm && filteredFiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No files found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
} 