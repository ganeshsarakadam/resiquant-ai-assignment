'use client'

import dynamic from 'next/dynamic'
import { PdfCarousel } from './PdfCarousel'
import type { ExtractedField } from '@/types'

// Dynamically import react-pdf components and setup to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then(async (mod) => {
    // Ensure PDF.js setup is loaded
    await import('@/lib/pdfjs-setup');
    return { default: mod.Document };
  }), 
  { ssr: false }
);

import type { PDFDocumentProxy } from 'pdfjs-dist'

interface PdfDocumentProps {
  documentUrl: string
  numPages: number
  fieldsByPage: Map<number, ExtractedField[]>
  initialPage: number
  onDocumentLoadSuccess?: (pdf: PDFDocumentProxy) => void
  onDocumentLoadError?: (error: Error) => void
  onHighlightClick?: (field: ExtractedField) => void
  onPageChange?: (page: number) => void
}

export const PdfDocument = ({
  documentUrl,
  numPages,
  fieldsByPage,
  initialPage,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onHighlightClick,
  onPageChange
}: PdfDocumentProps) => {
  return (
    <Document
      file={documentUrl}
      onLoadSuccess={doc => {
        // Adapt to consumer callback type (react-pdf doc shape is compatible superset)
        onDocumentLoadSuccess?.(doc as unknown as PDFDocumentProxy)
      }}
      onLoadError={onDocumentLoadError}
      error={<div className="p-4 text-red-600 text-sm">Failed to load PDF.</div>}
      noData={<div className="p-4 text-gray-500 text-sm">No PDF file.</div>}
    >
      <PdfCarousel
        numPages={numPages}
        fieldsByPage={fieldsByPage}
        initialPage={initialPage}
        onHighlightClick={onHighlightClick}
        onPageChange={onPageChange}
      />
    </Document>
  )
}
