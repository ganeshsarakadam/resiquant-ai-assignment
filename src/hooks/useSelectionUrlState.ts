'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface SelectionUrlState {
  submissionId: string;
  documentId: string;
  page: number | null;
}

export const useSelectionUrlState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const state = useMemo<SelectionUrlState>(() => {
    const pageParam = searchParams.get('page');
    return {
      submissionId: searchParams.get('submissionId') || '',
      documentId: searchParams.get('documentId') || '',
      page: pageParam ? parseInt(pageParam, 10) : null,
    };
  }, [searchParams]);

  const setState = useCallback((newState: Partial<SelectionUrlState>) => {
    // Merge with current state
    const merged: SelectionUrlState = {
      submissionId: newState.submissionId !== undefined ? newState.submissionId : state.submissionId,
      documentId:   newState.documentId   !== undefined ? newState.documentId   : state.documentId,
      page:         newState.page         !== undefined ? newState.page         : state.page,
    };

    // No-op guard
    if (
      merged.submissionId === state.submissionId &&
      merged.documentId   === state.documentId &&
      merged.page         === state.page
    ) {
      return;
    }

    // Build from current URL, not from scratch
    const currentParams = new URLSearchParams(searchParams.toString());

    // Deterministic set/delete
    merged.submissionId ? currentParams.set('submissionId', merged.submissionId) : currentParams.delete('submissionId');
    merged.documentId   ? currentParams.set('documentId',   merged.documentId)   : currentParams.delete('documentId');
    merged.page != null ? currentParams.set('page', String(merged.page))         : currentParams.delete('page');

    const target = currentParams.toString();

    // Skip only if equal to the *current* URL
    if (target === searchParams.toString()) return;

    const newUrl = `?${target}`;

    // Push for document change, replace for page-only change
    if (merged.documentId !== state.documentId) {
      router.push(newUrl);
    } else {
      router.replace(newUrl);
    }
  }, [router, state, searchParams]);

  const setSubmissionId = useCallback((submissionId: string) => {
    setState({ submissionId, documentId: '', page: null });
  }, [setState]);

  const setDocumentId = useCallback((documentId: string) => {
    setState({ documentId, page: 1 });
  }, [setState]);

  const setPageNumber = useCallback((pageNumber: number) => {
    setState({ page: pageNumber });
  }, [setState]);

  const resetState = useCallback(() => {
    setState({ submissionId: '', documentId: '', page: 1 });
  }, [setState]);

  const setDocumentAndPage = useCallback((documentId: string, pageNumber: number) => {
    setState({ documentId, page: pageNumber });
  }, [setState]);

  return {
    state,
    setState,
    setSubmissionId,
    setDocumentId,
    setPageNumber,
    setDocumentAndPage,
    resetState,
  };
};