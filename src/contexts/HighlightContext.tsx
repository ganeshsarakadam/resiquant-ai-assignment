
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect, useMemo } from 'react';
import { ExtractedField } from '@/types';
import { useSearchParams } from 'next/navigation';

// Split context into state and dispatch so components that only need the setter
// don't re-render when highlightedField changes.
const HighlightStateContext = createContext<ExtractedField | null | undefined>(undefined);
const HighlightDispatchContext = createContext<((field: ExtractedField) => void) | undefined>(undefined);

export const useHighlightedField = () => {
  const value = useContext(HighlightStateContext);
  if (value === undefined) throw new Error('useHighlightedField must be used within a HighlightProvider');
  return value;
};

export const useHighlightSetter = () => {
  const dispatch = useContext(HighlightDispatchContext);
  if (dispatch === undefined) throw new Error('useHighlightSetter must be used within a HighlightProvider');
  return dispatch;
};

// Backward-compatible hook (can be removed once migrated everywhere)
export const useHighlight = () => {
  const highlightedField = useHighlightedField();
  const highlightField = useHighlightSetter();
  return { highlightedField, highlightField };
};

interface HighlightProviderProps {
  children: ReactNode;
  onDocumentSelect?: (field: ExtractedField) => void;
}

export const HighlightProvider: React.FC<HighlightProviderProps> = ({ children, onDocumentSelect }) => {
  const [highlightedField, setHighlightedField] = useState<ExtractedField | null>(null);
  const searchParams = useSearchParams();
  const prevFieldRef = useRef<ExtractedField | null>(null);

  const clearTimerRef = useRef<number | null>(null);
  const HIGHLIGHT_TTL = 2000; // milliseconds

  const highlightField = useCallback((field: ExtractedField) => {
    // Avoid redundant updates
    if (prevFieldRef.current?.id === field.id) return;

    setHighlightedField(field);
    prevFieldRef.current = field;

    if (onDocumentSelect && field.provenance?.docId && field.provenance?.documentType !== 'xlsx') {
      const curDoc = searchParams.get('documentId') || '';
      const curPage = parseInt(searchParams.get('page') || '', 10) || 1;
      const nextDoc = field.provenance.docId;
      const nextPage = field.provenance.page || 1;

      if (curDoc !== nextDoc || curPage !== nextPage) {
        onDocumentSelect(field);
      }
    }

    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => {
      setHighlightedField(null);
      prevFieldRef.current = null;
    }, HIGHLIGHT_TTL);
  }, [onDocumentSelect, searchParams]);

  useEffect(() => () => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
  }, []);

  // Memoize state value so provider doesn't create a new reference unless the field changes.
  const stateValue = highlightedField; // primitive or object reference; fine as-is
  const dispatchValue = highlightField; // stable via useCallback

  return (
    <HighlightStateContext.Provider value={stateValue}>
      <HighlightDispatchContext.Provider value={dispatchValue}>
        {children}
      </HighlightDispatchContext.Provider>
    </HighlightStateContext.Provider>
  );
};
