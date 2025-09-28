'use client';

import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Document as DocumentType } from '@/types';
import '@/lib/pdfjs-setup';
import { PdfPageSkeleton } from './Skeletons/PdfPageSkeleton';  

interface PdfPageProps {
  document: DocumentType;
  pageNumber: number;
  onDocumentLoadSuccess?: (pdf: any) => void; // only fired for first page by parent usage
  onDocumentLoadError?: (error: Error) => void;
  onDocumentLoadProgress?: (progress: number) => void; // 0-1 only for first page
}

export const PdfPage = ({ document, pageNumber, onDocumentLoadSuccess, onDocumentLoadError, onDocumentLoadProgress }: PdfPageProps) => {
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDocumentLoadSuccess = (pdf: any) => {
    setIsDocumentLoaded(true);
    setDocumentError(null);
    
    // Only call parent callback for the first page to avoid multiple calls
    if (onDocumentLoadSuccess && pageNumber === 1) {
      onDocumentLoadSuccess(pdf);
    }
    
    // Add additional delay to ensure worker is fully ready
    setTimeout(() => {
      setIsWorkerReady(true);
    }, 200);
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('PDF Document load error:', error);
    setDocumentError(error.message);
    setIsDocumentLoaded(false);
    setIsWorkerReady(false);
    
    // Only call parent callback for the first page to avoid multiple calls
    if (onDocumentLoadError && pageNumber === 1) {
      onDocumentLoadError(error);
    }
  };

  const onPageLoadError = (error: Error) => {
    console.error('PDF Page load error:', error);
  };

  const handleProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    // Only track for first page's Document instance (parent ensures only first page passes callbacks)
    const ratio = total ? loaded / total : 0;
    setProgress(ratio);
    if (pageNumber === 1 && onDocumentLoadProgress) onDocumentLoadProgress(ratio);
  };

  // Reset state when document URL changes
  useEffect(() => {
    setIsDocumentLoaded(false);
    setIsWorkerReady(false);
    setDocumentError(null);
  }, [document.url]);

  if (documentError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-500">
          <p>Failed to load document</p>
          <p className="text-sm text-gray-500 mt-1">{documentError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="max-w-full max-h-full shadow-lg">
        <Document
          file={document.url}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          onLoadProgress={handleProgress}
          loading={<PdfPageSkeleton pageNumber={pageNumber} progress={progress} />}
          error={
            <div className="p-4 text-center text-sm text-red-600">
              Failed to load PDF document.
            </div>
          }
          noData={<div className="p-4 text-sm text-gray-500">No PDF file specified.</div>}
        >
          {isDocumentLoaded && isWorkerReady ? (
            <Page
              pageNumber={pageNumber}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              renderMode="canvas"
              onLoadError={onPageLoadError}
            />
          ) : (
            <PdfPageSkeleton pageNumber={pageNumber} progress={progress} />
          )}
        </Document>
      </div>
    </div>
  );
};
