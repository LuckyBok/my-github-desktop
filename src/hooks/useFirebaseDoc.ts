/**
 * useFirebaseDoc Hook
 * 
 * A custom hook for fetching and managing Firestore document data
 */
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseFirebaseDocOptions {
  collectionName: string;
  docId: string;
  disabled?: boolean;
}

interface UseFirebaseDocReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  updateDoc: (newData: Partial<T>) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useFirebaseDoc<T = DocumentData>({
  collectionName,
  docId,
  disabled = false
}: UseFirebaseDocOptions): UseFirebaseDocReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!disabled);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (disabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setData(docSnap.data() as T);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error(`Error fetching ${collectionName}/${docId}:`, err);
      setError(`Failed to load data from ${collectionName}`);
    } finally {
      setLoading(false);
    }
  };

  const updateDoc = async (newData: Partial<T>) => {
    if (disabled) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, collectionName, docId);
      
      // If we have existing data, merge with it
      const mergedData = data 
        ? { ...data, ...newData, updatedAt: new Date() }
        : { ...newData, updatedAt: new Date() };
        
      await setDoc(docRef, mergedData, { merge: true });
      
      // Update local state with the new data
      setData(mergedData as T);
    } catch (err) {
      console.error(`Error updating ${collectionName}/${docId}:`, err);
      setError(`Failed to update data in ${collectionName}`);
      throw err; // Re-throw to allow callers to handle the error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [collectionName, docId, disabled]);

  return {
    data,
    loading,
    error,
    updateDoc,
    refreshData: fetchData
  };
}

export default useFirebaseDoc; 