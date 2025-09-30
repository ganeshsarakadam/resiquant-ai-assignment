'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Document as DocType } from '@/types'
import { PdfHeader } from './PdfHeader'
import { PdfDocument } from './PdfDocument'
import type { ExtractedField } from '@/types'
import type { PdfDocumentMinimal } from '@/types'

export interface PdfViewerProps {
  document: DocType;
  initialPage?: number;
  onDocumentLoadSuccess?: (pdf: PdfDocumentMinimal) => void;
  onDocumentLoadError?: (error: Error) => void;
  onDocumentLoadProgress?: (ratio: number) => void;
  submissionId?: string;
  onHighlightClick?: (field: ExtractedField) => void;
  extractedFields: ExtractedField[];
  onPageChange?: (page: number) => void;
}

export const PdfViewer = ({
  document: doc,
  extractedFields,
  initialPage = 1,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onHighlightClick,
  onPageChange,
}: PdfViewerProps) => { 
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [reloadToken, setReloadToken] = useState(0)

  /**
   * Memoize fields by page
   * @returns Map of page with extracted fields linked to the page
   * @description This is the fieldsByPage function that memoizes the fields by page
   */
  const fieldsByPage = useMemo(() => {
    const map = new Map<number, ExtractedField[]>()
    for (const field of extractedFields || []) {
      if (field.provenance.docName === doc.name && field.provenance.bbox && field.provenance.page) {
        const arr = map.get(field.provenance.page) || []
        arr.push(field)
        map.set(field.provenance.page, arr)
      }
    }
    return map
  }, [extractedFields, doc.name])

  /**
   * On document load success, we set the number of pages and the current page
   * @param pdf 
   * @description This is the handleDocSuccess function that handles the document load success
   */
  const handleDocSuccess = useCallback((pdf: PdfDocumentMinimal) => {
    setNumPages(pdf.numPages)
    setCurrentPage(initialPage)
    onDocumentLoadSuccess?.(pdf)
  }, [initialPage, onDocumentLoadSuccess])

  /**
   * On document load error, we set the error
   * @param err 
   * @description This is the handleDocError function that handles the document load error
   */
  const handleDocError = useCallback((err: Error) => {
    onDocumentLoadError?.(err)
  }, [onDocumentLoadError])

  /**
   * Handle page change from carousel
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    onPageChange?.(page)
  }, [onPageChange])

  return (
    <div className="h-full flex flex-col">
      {/* Top bar - Fixed header */}
      <PdfHeader 
        numPages={numPages}
        currentPage={currentPage}
        onDownload={() => {
       const a = window.document.createElement('a')
       a.href = doc.url as string
       a.download = doc.name
       window.document.body.appendChild(a)
       a.click()
       window.document.body.removeChild(a)
        }}
        onRetry={() => {
          // bump token to force PdfDocument remount
          setReloadToken(t => t + 1)
        }}
      />

      {/* Main viewer: scrollable content area */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <PdfDocument
          key={reloadToken}
          documentUrl={doc.url}
          numPages={numPages}
          fieldsByPage={fieldsByPage}
          initialPage={initialPage}
          onDocumentLoadSuccess={handleDocSuccess}
          onDocumentLoadError={handleDocError}
          onHighlightClick={onHighlightClick}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}

export default PdfViewer
