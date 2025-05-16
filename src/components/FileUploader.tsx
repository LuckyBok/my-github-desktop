'use client';

import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import CategorySelector from './CategorySelector';

interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  categoryId: string;
  downloadURL: string;
  uploadedAt: Timestamp;
}

interface FileUploaderProps {
  onUploadComplete?: (fileUrl: string, metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function FileUploader({
  onUploadComplete,
  onError,
  className = '',
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const saveFileMetadata = async (downloadURL: string): Promise<FileMetadata> => {
    if (!selectedFile || !selectedCategoryId) {
      throw new Error('File and category are required to save metadata');
    }

    const metadata: FileMetadata = {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      categoryId: selectedCategoryId,
      downloadURL,
      uploadedAt: serverTimestamp() as Timestamp,
    };

    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'files'), metadata);
      console.log('File metadata saved with ID:', docRef.id);
      return metadata;
    } catch (error) {
      console.error('Error saving file metadata:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCategoryId) {
      alert('Please select both a file and a category');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create a storage reference
      const storageRef = ref(storage, `files/${selectedCategoryId}/${selectedFile.name}`);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      // Listen for upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          onError?.(error);
          setIsUploading(false);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save metadata to Firestore
            const metadata = await saveFileMetadata(downloadURL);

            // Reset form
            setSelectedFile(null);
            setSelectedCategoryId('');
            setUploadProgress(0);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }

            // Notify parent component with both URL and metadata
            onUploadComplete?.(downloadURL, metadata);
          } catch (error) {
            console.error('Error in upload completion:', error);
            onError?.(error as Error);
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      onError?.(error as Error);
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📄 Select File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          disabled={isUploading}
        />
        {selectedFile && (
          <p className="mt-1 text-sm text-gray-500">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Category Selector */}
      <CategorySelector
        onSelect={setSelectedCategoryId}
        selectedCategoryId={selectedCategoryId}
      />

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || !selectedCategoryId || isUploading}
        className={`w-full px-4 py-2 text-white font-medium rounded-lg
          ${!selectedFile || !selectedCategoryId || isUploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }
          transition-colors duration-200`}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>

      {/* Progress Bar */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
          <p className="mt-1 text-sm text-gray-600 text-center">
            {uploadProgress.toFixed(1)}% uploaded
          </p>
        </div>
      )}
    </div>
  );
} 