'use client';

import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { logFileUploadToGoogleSheets } from '@/lib/webhooks';
import { generateFileMetadata } from '@/lib/openai';
import CategorySelector from './CategorySelector';
import { categories } from '@/lib/categories';

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  categoryId: string;
  downloadURL: string;
  uploadedAt: Timestamp;
  storagePath?: string;
  organization?: string;
  summary?: string;
  tags?: string[];
  notes?: string;
}

interface GptSuggestion {
  suggestedCategoryId: string;
  categoryReason: string;
  summary: string;
  tags: string[];
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
  maxFileSizeMB = 20,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [organization, setOrganization] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [generatingMetadata, setGeneratingMetadata] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New state for GPT suggestions
  const [gptSuggestion, setGptSuggestion] = useState<GptSuggestion | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [showSuggestionPreview, setShowSuggestionPreview] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    // Reset all states
    setSheetsError(null);
    setAiError(null);
    setFileSizeError(null);
    setUploadSuccess(false);
    setGptSuggestion(null);
    setShowSuggestionPreview(false);
    
    // Validate file size
    if (file) {
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxFileSizeMB) {
        setFileSizeError(`File size exceeds the ${maxFileSizeMB}MB limit. Please choose a smaller file.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }
    
    setSelectedFile(file);
    
    // Clear category if file changed
    setSelectedCategoryId('');
    
    // Auto-generate GPT suggestions when file is selected
    if (file && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      generateSuggestions(file.name);
    }
  };
  
  // Generate category and metadata suggestions from GPT
  const generateSuggestions = async (fileName: string) => {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) return;
    
    try {
      setIsGeneratingSuggestion(true);
      setAiError(null);
      
      const gptMetadata = await generateFileMetadata(fileName, notes);
      
      if (gptMetadata.suggestedCategoryId) {
        setGptSuggestion({
          suggestedCategoryId: gptMetadata.suggestedCategoryId,
          categoryReason: gptMetadata.categoryReason || 'Based on file name analysis',
          summary: gptMetadata.summary,
          tags: gptMetadata.tags
        });
        setShowSuggestionPreview(true);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setAiError('Failed to generate category suggestions.');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Apply GPT suggestion
  const applySuggestion = () => {
    if (gptSuggestion?.suggestedCategoryId) {
      setSelectedCategoryId(gptSuggestion.suggestedCategoryId);
      setShowSuggestionPreview(false);
    }
  };
  
  // Dismiss suggestion
  const dismissSuggestion = () => {
    setShowSuggestionPreview(false);
  };

  const saveFileMetadata = async (downloadURL: string): Promise<FileMetadata> => {
    if (!selectedFile || !selectedCategoryId) {
      throw new Error('File and category are required to save metadata');
    }

    const storagePath = `files/${selectedCategoryId}/${selectedFile.name}`;
    
    const metadata: FileMetadata = {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      categoryId: selectedCategoryId,
      downloadURL,
      uploadedAt: serverTimestamp() as Timestamp,
      storagePath: storagePath,
    };
    
    // Add optional fields if provided
    if (organization.trim()) {
      metadata.organization = organization.trim();
    }
    
    if (notes.trim()) {
      metadata.notes = notes.trim();
    }
    
    // Add GPT metadata if available
    if (gptSuggestion) {
      metadata.summary = gptSuggestion.summary;
      metadata.tags = gptSuggestion.tags;
    }

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

  const logToGoogleSheets = async (metadata: FileMetadata) => {
    try {
      // Convert Firebase Timestamp to ISO string for the webhook
      const uploadedAt = metadata.uploadedAt?.toDate?.() 
        ? metadata.uploadedAt.toDate().toISOString() 
        : new Date().toISOString();
      
      // Send to Google Sheets webhook
      await logFileUploadToGoogleSheets({
        fileName: metadata.fileName,
        categoryId: metadata.categoryId,
        fileSize: metadata.fileSize,
        uploadedAt,
        organization: metadata.organization
      });
      
      setUploadSuccess(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to log to Google Sheets:', error);
      setSheetsError('Failed to log to Google Sheets. The file was uploaded but not logged.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCategoryId) {
      alert('Please select both a file and a category');
      return;
    }
    
    // Double-check file size before upload
    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSizeMB) {
      setFileSizeError(`File size exceeds the ${maxFileSizeMB}MB limit. Please choose a smaller file.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setSheetsError(null);
      setAiError(null);
      setFileSizeError(null);
      setUploadSuccess(false);

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

            // Log the upload to Google Sheets
            await logToGoogleSheets(metadata);

            // Reset form
            setSelectedFile(null);
            setSelectedCategoryId('');
            setOrganization('');
            setNotes('');
            setUploadProgress(0);
            setGptSuggestion(null);
            setShowSuggestionPreview(false);
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

  // Find category name by ID
  const getCategoryNameById = (id: string) => {
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Unknown Category';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          📄 Select File
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            dark:file:bg-blue-900/30 dark:file:text-blue-300
            hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40"
          disabled={isUploading}
        />
        {selectedFile && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
      
      {/* AI Suggestion Preview */}
      {showSuggestionPreview && gptSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              AI-Suggested Category
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={applySuggestion}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Apply
              </button>
              <button 
                onClick={dismissSuggestion}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
              >
                Override
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category: </span>
              <span className="text-sm text-gray-800 dark:text-gray-200">
                {getCategoryNameById(gptSuggestion.suggestedCategoryId)}
              </span>
            </div>
            
            <div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reason: </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{gptSuggestion.categoryReason}</span>
            </div>
            
            {gptSuggestion.summary && (
              <div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Summary: </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{gptSuggestion.summary}</span>
              </div>
            )}
            
            {gptSuggestion.tags && gptSuggestion.tags.length > 0 && (
              <div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tags: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {gptSuggestion.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* AI Suggestion Loading State */}
      {isGeneratingSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <p className="text-sm text-blue-700 dark:text-blue-300">Generating category and metadata suggestions...</p>
        </div>
      )}

      {/* Category Selector */}
      <CategorySelector
        onSelect={setSelectedCategoryId}
        selectedCategoryId={selectedCategoryId}
      />
      
      {/* Organization Input (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          🏢 Organization (Optional)
        </label>
        <input
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Enter organization name"
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
          disabled={isUploading}
        />
      </div>
      
      {/* Notes Input (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          📝 Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            // Re-generate suggestions when notes change
            if (selectedFile && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
              generateSuggestions(selectedFile.name);
            }
          }}
          placeholder="Add notes about this file to help generate better AI metadata"
          rows={3}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
          disabled={isUploading}
        />
      </div>

      {/* AI Metadata Status Messages */}
      {process.env.NEXT_PUBLIC_OPENAI_API_KEY && !isGeneratingSuggestion && !showSuggestionPreview && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            AI will generate category suggestions, summary and tags for your file
          </p>
        </div>
      )}

      {/* Google Sheets Status Messages */}
      {sheetsError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                {sheetsError}
              </h3>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Metadata Error Message */}
      {aiError && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {aiError}
              </h3>
            </div>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                File uploaded and logged to Google Sheets successfully!
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* File Size Error Message */}
      {fileSizeError && (
        <div className="mt-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                {fileSizeError}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || !selectedCategoryId || isUploading}
        className={`w-full px-4 py-2 text-white font-medium rounded-lg
          ${!selectedFile || !selectedCategoryId || isUploading
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
          }
          transition-colors duration-200`}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>

      {/* Progress Bar */}
      {isUploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-center">
            {uploadProgress.toFixed(1)}% uploaded
          </p>
        </div>
      )}
    </div>
  );
} 