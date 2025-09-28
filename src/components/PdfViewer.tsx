// app/components/PdfViewer.jsx
'use client'; // Mark as client component for Next.js 15+

import { useState } from 'react';   
import { Document, Page } from 'react-pdf';
import { Document as DocumentType } from '@/types';
import '@/lib/pdfjs-setup';

export const PdfViewer = ({ document }: { document: DocumentType }) => { 
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages || null);
  };

  return (
    <div className="pdf-container">
      <Document
        file={document.url} // Replace with your PDF path (e.g., in public/ folder)
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.error('PDF load error:', error)}
      >
        <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} renderMode="canvas" />
      </Document>
      <div className="pdf-controls">
        <p>
          Page {pageNumber} of {numPages}
        </p>
        <button
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber(pageNumber - 1)}
        >
          Previous
        </button>
         <button
           disabled={!numPages || pageNumber >= numPages}    
           onClick={() => setPageNumber(pageNumber + 1)}
         >
          Next
        </button>
      </div>
    </div>
  );
};  

// Wrap with dynamic import to disable SSR
