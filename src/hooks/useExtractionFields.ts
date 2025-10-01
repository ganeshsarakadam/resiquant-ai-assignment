'use client'

import { useState, useCallback } from "react";
import { loadExtraction } from "@/lib/utils";
import { ExtractedField } from "@/types";

interface Fields extends ExtractedField {
  originalValue: string;
  modifiedValue: string;
  status: "modified" | "original";
}

interface UseExtractionFieldsReturn {
  fields: Fields[];
  isLoading: boolean;
  error: string | null;
  isModified: boolean;
  loadExtractionFields: (submissionId: string, clearLocalStorage?: boolean) => Promise<void>;
  hasLocalStorageData: (submissionId: string) => boolean;
  setFields: React.Dispatch<React.SetStateAction<Fields[]>>;
  setIsModified: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useExtractionFields = (): UseExtractionFieldsReturn => {
  const [fields, setFields] = useState<Fields[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);

  const getFieldsFromLocalStorage = useCallback((submissionId: string) => {
    const LOCAL_STORAGE_KEY = `extractedFields_${submissionId}`;
    const fields = localStorage.getItem(LOCAL_STORAGE_KEY);
    console.log('Loading from localStorage:', LOCAL_STORAGE_KEY, fields);
    
    if (!fields || fields === '[]' || fields === '') {
      return [];
    }
    
    try {
      const parsedFields = JSON.parse(fields);
      return Array.isArray(parsedFields) ? parsedFields : [];
    } catch (error) {
      console.error('Failed to parse localStorage fields:', error);
      return [];
    }
  }, []);

  const saveFieldsToLocalStorage = useCallback((submissionId: string, fieldsToSave: Fields[]) => {
    const LOCAL_STORAGE_KEY = `extractedFields_${submissionId}`;
    console.log('Saving to localStorage:', LOCAL_STORAGE_KEY, fieldsToSave);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fieldsToSave));
  }, []);

  const hasLocalStorageData = useCallback((submissionId: string) => {
    const LOCAL_STORAGE_KEY = `extractedFields_${submissionId}`;
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data !== null && data !== '[]' && data !== '';
  }, []);

  const loadExtractionFields = useCallback(async (submissionId: string, clearLocalStorage = false) => {
    if (!submissionId) return;
    
    // Clear previous state immediately when loading new submission
    setFields([]);
    setIsModified(false);
    setError(null);
    setIsLoading(true);
    
    try {
      if (clearLocalStorage) {
        const LOCAL_STORAGE_KEY = `extractedFields_${submissionId}`;
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      const localFields = getFieldsFromLocalStorage(submissionId);
      console.log('Local fields found:', localFields.length, localFields);
      
      if (localFields.length > 0 && !clearLocalStorage) {
        setFields(localFields);
        setIsModified(true);
      } else {
        const extractionData = await loadExtraction(submissionId);
        if (extractionData?.extractedFields) {
          const fieldsWithStatus = extractionData.extractedFields.map((field) => ({
            ...field,
            originalValue: field.value,
            modifiedValue: '',
            status: "original" as const
          }));
          setFields(fieldsWithStatus);
          setIsModified(false);
        } else {
          // No extraction data found for this submission
          setFields([]);
          setIsModified(false);
        }
      }
    } catch (error) {
      console.error('Failed to load fields:', error);
      setError('Failed to load fields');
      setFields([]);
      setIsModified(false);
    } finally {
      setIsLoading(false);
    }
  }, [getFieldsFromLocalStorage]);

  return {
    fields,
    isLoading,
    error,
    isModified,
    loadExtractionFields,
    hasLocalStorageData,
    setFields,
    setIsModified,
    setError
  };
};
