'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { submissions } from '@/data/submissions.manifest';
import { Submission, Document } from '@/types';

/**
 * State interface for the submission viewer
 */
  export interface SelectionUrlState {
  submissionId: string;
  documentId: string;
  page: number | null;
}

// /**
//  * Current state with resolved objects
//  */
// export interface SubmissionStateWithObjects {
//   submissionId: string;
//   documentId: string;
//   pageNumber: number;
//   submission: Submission | null;
//   document: Document | null;
// }


export const useSelectionUrlState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current query parameters into state
  const state = useMemo((): SelectionUrlState => {
    const pageParam = searchParams.get('page');
    return {
      submissionId: searchParams.get('submissionId') || '',
      documentId: searchParams.get('documentId') || '',
      page: pageParam ? parseInt(pageParam, 10) : null,
    };
  }, [searchParams]);

  // Get resolved objects from the state
  // const stateWithObjects = useMemo((): SubmissionStateWithObjects => {
  //   const submission = submissions.find(sub => sub.submissionId === state.submissionId) || null;
  //   const document = submission?.documents.find(doc => doc.id === state.documentId) || null;

  //   return {
  //     ...state,
  //     submission,
  //     document,
  //   };
  // }, [state]);

  // Update query parameters
  const setState = useCallback((newState: Partial<SelectionUrlState>) => {
    const currentParams = new URLSearchParams(searchParams.toString());

    // Update the URL parameters
    Object.entries(newState).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        currentParams.set(key, value.toString());
      } else {
        currentParams.delete(key);
      }
    });

    // Navigate to the new URL
    router.replace(`?${currentParams.toString()}`);
  }, [router, searchParams]);

  // Helper functions for specific state updates
  const setSubmissionId = useCallback((submissionId: string) => {
    setState({ 
      submissionId,
      documentId: '', // Clear document when submission changes
      page: null // Remove page parameter when submission changes
    });
  }, [setState]);

  const setDocumentId = useCallback((documentId: string) => {
    setState({ 
      documentId, 
      page: 1 // Remove page parameter when document changes (defaults to page 1)
    });
  }, [setState]);

  const setPageNumber = useCallback((pageNumber: number) => {
    setState({ page: pageNumber });
  }, [setState]);

  const resetState = useCallback(() => {
    setState({
      submissionId: '',
      documentId: '',
      page: 1,
    });
  }, [setState]);

  return {
    // Current state
    state,
    // stateWithObjects,
    
    // State setters
    setState,
    setSubmissionId,
    setDocumentId,
    setPageNumber,
    resetState,
    
    // // Computed values
    // hasSubmission: !!stateWithObjects.submission,
    // hasDocument: !!stateWithObjects.document,
    // isReady: !!stateWithObjects.submission && !!stateWithObjects.document,
  };
};
