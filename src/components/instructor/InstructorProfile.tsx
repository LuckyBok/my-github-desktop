/**
 * InstructorProfile component
 * 
 * Manages instructor profile information with edit capabilities
 */
'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

// Import reusable components
import DashboardCard from '../ui/DashboardCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorAlert from '../ui/ErrorAlert';
import useFirebaseDoc from '@/hooks/useFirebaseDoc';

export interface ProfileData {
  name: string;
  tagline: string;
  bio: string;
  imageUrl: string;
  updatedAt?: Date;
}

export interface InstructorProfileProps {
  testId?: string;
}

const InstructorProfile: React.FC<InstructorProfileProps> = ({ 
  testId = 'instructor-profile' 
}) => {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Use our custom hook for fetching and updating profile data
  const { 
    data: profile, 
    loading, 
    error, 
    updateDoc 
  } = useFirebaseDoc<ProfileData>({
    collectionName: 'instructorProfile',
    docId: 'main',
    disabled: !isAdmin
  });

  // Create a mutable copy for the form
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    tagline: '',
    bio: '',
    imageUrl: ''
  });

  // When profile data is loaded, update form data
  if (profile && formData.name === '' && !isEditing) {
    setFormData(profile);
  }

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Start editing mode
  const handleStartEditing = () => {
    setFormData(profile || {
      name: '',
      tagline: '',
      bio: '',
      imageUrl: ''
    });
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileImage(null);
    setImagePreview(null);
    setSaveError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      
      let imageUrl = formData.imageUrl;
      
      // Upload new image if selected
      if (profileImage) {
        const storageRef = ref(storage, `profile/instructor-${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, profileImage);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Update profile using our hook
      await updateDoc({
        ...formData,
        imageUrl
      });
      
      // Reset edit state
      setIsEditing(false);
      setProfileImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveError('Failed to save profile information');
    } finally {
      setSaving(false);
    }
  };

  // Only available to admins
  if (!isAdmin) {
    return null;
  }

  // Show loading state
  if (loading && !profile) {
    return <LoadingSpinner message="Loading profile information..." testId={`${testId}-loading`} />;
  }

  // Content to render based on edit mode
  const content = isEditing ? (
    // Edit Form
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Image Upload */}
        <div className="col-span-full flex items-center space-x-4">
          <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            {imagePreview ? (
              <Image 
                src={imagePreview} 
                alt="Profile preview" 
                className="h-full w-full object-cover"
                fill
                sizes="96px"
              />
            ) : formData.imageUrl ? (
              <Image 
                src={formData.imageUrl} 
                alt={formData.name} 
                className="h-full w-full object-cover"
                fill
                sizes="96px"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                dark:file:bg-blue-900/30 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40"
              aria-label="Upload profile image"
            />
          </div>
        </div>
        
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md"
            placeholder="Your full name"
            aria-required="true"
          />
        </div>
        
        {/* Tagline Input */}
        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tagline
          </label>
          <input
            type="text"
            id="tagline"
            name="tagline"
            value={formData.tagline}
            onChange={handleInputChange}
            className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md"
            placeholder="Professional headline (e.g., 'Cybersecurity Expert & Instructor')"
          />
        </div>
        
        {/* Bio Input */}
        <div className="col-span-full">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Professional Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleInputChange}
            className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md"
            placeholder="A short professional bio highlighting your expertise and experience"
          />
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={saving}
          className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Cancel editing"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white ${
            saving
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
          aria-label="Save profile"
          aria-busy={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
      
      {/* Error Message */}
      {saveError && <ErrorAlert message={saveError} testId={`${testId}-save-error`} />}
    </form>
  ) : (
    // Display Profile
    <div className="relative">
      {/* Edit button */}
      <button
        onClick={handleStartEditing}
        className="absolute top-0 right-0 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-label="Edit profile"
      >
        <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Profile Image */}
        <div className="relative h-32 w-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md">
          {profile?.imageUrl ? (
            <Image 
              src={profile.imageUrl} 
              alt={profile.name}
              className="h-full w-full object-cover"
              fill
              sizes="128px"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Profile Information */}
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile?.name || 'Add Your Name'}
          </h3>
          <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
            {profile?.tagline || 'Add a professional tagline'}
          </p>
          <div className="mt-3 text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {profile?.bio || 'Click the edit button to add your professional bio.'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid={testId}>
      {/* Display fetchData error if any */}
      {error && <ErrorAlert message={error} testId={`${testId}-fetch-error`} />}
      
      {/* Profile content */}
      {content}
    </div>
  );
};

export default InstructorProfile; 