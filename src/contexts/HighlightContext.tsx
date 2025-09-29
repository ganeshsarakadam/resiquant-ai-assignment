'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { ExtractedField } from '@/types';
import { useSearchParams } from 'next/navigation';

interface HighlightContextType {
  highlightedField: ExtractedField | null;
  highlightField: (field: ExtractedField) => void;
}

const HighlightContext = createContext<HighlightContextType | undefined>(undefined);

export const useHighlight = () => {
  const ctx = useContext(HighlightContext);
  if (!ctx) throw new Error('useHighlight must be used within a HighlightProvider');
  return ctx;
};

interface HighlightProviderProps {
  children: ReactNode;
  onDocumentSelect?: (field: ExtractedField) => void;
}

export const HighlightProvider: React.FC<HighlightProviderProps> = ({ children, onDocumentSelect }) => {
  const [highlightedField, setHighlightedField] = useState<ExtractedField | null>(null);
  const searchParams = useSearchParams();

  const clearTimerRef = useRef<number | null>(null);
  const HIGHLIGHT_TTL = 6000; // a bit more forgiving

  const highlightField = useCallback((field: ExtractedField) => {
    setHighlightedField(prev => (prev?.id === field.id ? prev : field));

    if (onDocumentSelect && field.provenance?.docId) {
      const curDoc  = searchParams.get('documentId') || '';
      const curPage = parseInt(searchParams.get('page') || '', 10) || 1;
      const nextDoc  = field.provenance.docId;
      const nextPage = field.provenance.page || 1;

      if (curDoc !== nextDoc || curPage !== nextPage) {
        onDocumentSelect(field);
      }
    }

    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    clearTimerRef.current = window.setTimeout(() => setHighlightedField(null), HIGHLIGHT_TTL);
  }, [onDocumentSelect, searchParams]);

  useEffect(() => () => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
  }, []);

  return (
    <HighlightContext.Provider value={{ highlightedField, highlightField }}>
      {children}
    </HighlightContext.Provider>
  );
};
