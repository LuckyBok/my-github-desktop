'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface ProfileData {
  name: string;
  tagline: string;
  bio: string;
  imageUrl: string;
}

export default function InstructorProfile() {
  const { user, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    tagline: '',
    bio: '',
    imageUrl: '',
  });

  // Fetch profile data
  useEffect(() => {
    if (!isAdmin) return;

    async function fetchProfileData() {
      try {
        setLoading(true);
        const docRef = doc(db, 'instructorProfile', 'main');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as ProfileData);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile information');
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [isAdmin]);

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
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) return;
    
    try {
      setSaving(true);
      setError(null);
      
      let imageUrl = profile.imageUrl;
      
      // Upload new image if selected
      if (profileImage) {
        const storageRef = ref(storage, `profile/instructor-${Date.now()}`);
        const uploadResult = await uploadBytes(storageRef, profileImage);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Update profile in Firestore
      await setDoc(doc(db, 'instructorProfile', 'main'), {
        ...profile,
        imageUrl,
        updatedAt: new Date(),
      });
      
      // Update local state
      setProfile(prev => ({ ...prev, imageUrl }));
      setIsEditing(false);
      setProfileImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile information');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isEditing ? (
        // Edit Form
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile Image Upload */}
            <div className="col-span-full flex items-center space-x-4">
              <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="h-full w-full object-cover"
                  />
                ) : profile.imageUrl ? (
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
                value={profile.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md"
                placeholder="Your full name"
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
                value={profile.tagline}
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
                value={profile.bio}
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
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
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
          )}
        </form>
      ) : (
        // Display Profile
        <div className="relative">
          {/* Edit button */}
          <button
            onClick={() => setIsEditing(true)}
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
              {profile.imageUrl ? (
                <img 
                  src={profile.imageUrl} 
                  alt={profile.name}
                  className="h-full w-full object-cover"
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
                {profile.name || 'Add Your Name'}
              </h3>
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
                {profile.tagline || 'Add a professional tagline'}
              </p>
              <div className="mt-3 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {profile.bio || 'Click the edit button to add your professional bio.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 