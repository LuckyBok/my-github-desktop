'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LectureRequest {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: Timestamp;
}

export default function LectureRequests() {
  const [requests, setRequests] = useState<LectureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      setError(null);
      
      try {
        const requestsQuery = query(
          collection(db, 'requests'),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(requestsQuery);
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
        })) as LectureRequest[];
        
        setRequests(requestsData);
      } catch (err) {
        console.error('Error fetching lecture requests:', err);
        setError('Failed to load lecture requests');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRequests();
  }, []);
  
  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'requests', requestId));
      
      // Update the UI
      setRequests(requests.filter(request => request.id !== requestId));
      
      // Show success message
      setDeleteSuccess('Request deleted successfully');
      setTimeout(() => setDeleteSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError('Failed to delete request');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return 'Unknown date';
    }
    
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Lecture Requests</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Lecture Requests</h2>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 rounded-lg">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Lecture Requests</h2>
      
      {deleteSuccess && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-4 rounded-lg mb-4">
          <p className="text-green-800 dark:text-green-300">{deleteSuccess}</p>
        </div>
      )}
      
      {requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No lecture requests yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(request => (
            <div key={request.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {request.topic}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    From: {request.name} ({request.email})
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 md:mt-0">
                  {formatDate(request.createdAt)}
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 my-4 whitespace-pre-wrap">
                {request.message}
              </p>
              
              <div className="flex justify-between items-center mt-4">
                <a 
                  href={`mailto:${request.email}?subject=Re: ${encodeURIComponent(request.topic)}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Reply via Email
                </a>
                
                <button
                  onClick={() => handleDelete(request.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 