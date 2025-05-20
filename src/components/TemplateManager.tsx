'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface TemplateData {
  id: string;
  title: string;
  description: string;
  fileType: string;
  downloadURL: string;
  price?: string;
  tags?: string[];
  uploadedAt: any;
  storagePath?: string;
}

interface TemplateForm {
  title: string;
  description: string;
  price: string;
  tags: string;
}

export default function TemplateManager() {
  const { isAdmin } = useAuth();
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [timestamp, setTimestamp] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [templateForm, setTemplateForm] = useState<TemplateForm>({
    title: '',
    description: '',
    price: '',
    tags: ''
  });

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true);
    setTimestamp(Date.now());
  }, []);
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const templatesQuery = query(
        collection(db, 'templates'),
        orderBy('uploadedAt', 'desc')
      );
      
      const snapshot = await getDocs(templatesQuery);
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TemplateData[];
      
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!templateForm.title || !templateForm.description) {
      setError('Title and description are required');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Create a storage reference with a safe timestamp
      const currentTimestamp = isClient ? timestamp : 0;
      const storagePath = `templates/${currentTimestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);
      
      // Upload file
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
          setError('Failed to upload file');
          setIsUploading(false);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Parse tags from comma-separated string
            const parsedTags = templateForm.tags
              ? templateForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
              : [];
            
            // Save to Firestore
            const templateData = {
              title: templateForm.title,
              description: templateForm.description,
              fileType: selectedFile.type,
              downloadURL,
              price: templateForm.price || 'Free',
              tags: parsedTags,
              uploadedAt: serverTimestamp(),
              storagePath
            };
            
            await addDoc(collection(db, 'templates'), templateData);
            
            // Reset form
            setTemplateForm({
              title: '',
              description: '',
              price: '',
              tags: ''
            });
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setSuccessMessage('Template uploaded successfully');
            setTimeout(() => setSuccessMessage(null), 5000);
            
            // Refresh templates
            fetchTemplates();
          } catch (error) {
            console.error('Error saving template:', error);
            setError('Failed to save template');
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error uploading template:', error);
      setError('Failed to upload template');
      setIsUploading(false);
    }
  };
  
  const handleDelete = async (template: TemplateData) => {
    if (!confirm(`Are you sure you want to delete "${template.title}"?`)) {
      return;
    }
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'templates', template.id));
      
      // Delete from Storage if we have a storage path
      if (template.storagePath) {
        const storageRef = ref(storage, template.storagePath);
        await deleteObject(storageRef).catch(err => {
          console.warn('Could not delete file from storage:', err);
        });
      }
      
      // Update UI
      setTemplates(templates.filter(t => t.id !== template.id));
      setSuccessMessage('Template deleted successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Template Market Management
      </h2>
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      
      {/* Template Upload Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Template</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={templateForm.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              placeholder="e.g. Lecture Planner Template"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={templateForm.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              placeholder="Provide a detailed description of the template"
              required
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price (leave empty for free)
            </label>
            <input
              type="text"
              id="price"
              name="price"
              value={templateForm.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              placeholder="e.g. 5 (without $ sign, or leave empty for free)"
            />
          </div>
          
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={templateForm.tags}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              placeholder="e.g. Teaching, Planning, Productivity"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template File
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
              required
            />
            {selectedFile && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading... {uploadProgress.toFixed(0)}%
                </>
              ) : (
                'Upload Template'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Template List */}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manage Templates</h3>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No templates available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {template.title}
                </h4>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-wrap gap-1">
                    {template.tags?.map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.price === 'Free' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  }`}>
                    {template.price === 'Free' ? 'Free' : `$${template.price}`}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <a 
                    href={template.downloadURL}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Preview
                  </a>
                  
                  <button
                    onClick={() => handleDelete(template)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 