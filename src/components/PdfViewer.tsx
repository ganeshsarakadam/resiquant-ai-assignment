'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Document as DocType } from '@/types'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'
import { HighlightOverlay } from './HighlightOverlay'
import type { ExtractedField } from '@/types'
import { Download, RefreshCw, FileText } from 'lucide-react'

/**
 * Dynamically import react-pdf components and setup to avoid SSR issues
 * @returns Document component from react-pdf 
 */
const Document = dynamic(
  () => import('react-pdf').then(async (mod) => {
    // Ensure PDF.js setup is loaded
    await import('@/lib/pdfjs-setup');
    return { default: mod.Document };
  }), 
  { ssr: false }
);

/**
 * Dynamically import Page component from react-pdf
 * @returns Page component from react-pdf
 */
const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false });


export interface PdfViewerProps {
  document: DocType;
  initialPage?: number;
  onDocumentLoadSuccess?: (pdf: any) => void;
  onDocumentLoadError?: (error: Error) => void;
  onDocumentLoadProgress?: (ratio: number) => void;
  submissionId?: string;
  onHighlightClick?: (field: ExtractedField) => void;
  extractedFields: ExtractedField[];
  onPageChange?: (page: number) => void;
}

export const PdfViewer = ({
  document,
  extractedFields,
  initialPage = 1,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onHighlightClick,
  onPageChange,
}: PdfViewerProps) => { 
  const [api, setApi] = useState<CarouselApi>()
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const containerRefs = useRef<Map<number, HTMLDivElement>>(new Map())


 /**
  * Memoize fields by page
  * @returns Map of page with extracted fields linked to the page
  * @description This is the fieldsByPage function that memoizes the fields by page
  */
  const fieldsByPage = useMemo(() => {
    if (!extractedFields) return new Map<number, ExtractedField[]>()
    const map = new Map<number, ExtractedField[]>()
    for (const field of extractedFields) {
      if (field.provenance.docName === document.name && field.provenance.bbox && field.provenance.page) {
        const arr = map.get(field.provenance.page) || []
        arr.push(field)
        map.set(field.provenance.page, arr)
      }
    }
    return map
  }, [extractedFields, document.name])


/**
 * On document load success, we set the number of pages and the current page
 * @param pdf 
 * @description This is the handleDocSuccess function that handles the document load success
 */
  const handleDocSuccess = (pdf: any) => {
    setNumPages(pdf.numPages)
    setCurrentPage(initialPage)
    onDocumentLoadSuccess?.(pdf)
    if (api) {
      api.scrollTo(initialPage - 1)
    }
  }

/**
 * On document load error, we set the error
 * @param err 
 * @description This is the handleDocError function that handles the document load error
 */
  const handleDocError = (err: Error) => {
    onDocumentLoadError?.(err)
  }


/**
 * On page change, we set the current page and the page number
 * @param api 
 * @param currentPage 
 * @param onPageChange 
 * @returns void
 * @description This is the useEffect hook that handles the page change
 */
    useEffect(() => {
    if (!api) return
    
    const handleSelect = () => {
      const idx = api.selectedScrollSnap()
      const newPage = idx + 1
      if (newPage !== currentPage) {
        setCurrentPage(newPage)
        onPageChange?.(newPage)
      }
    }
    api.on('select', handleSelect)
    return () => {
      api.off('select', handleSelect)
    }
  }, [api, currentPage, onPageChange])


  /**
   * On initial page, we scroll to the initial page
   * @param api 
   * @param initialPage 
   * @returns void
   * @description This is the useEffect hook that handles the initial page
   */
useEffect(() => {
  if (!api) return
  api.scrollTo(initialPage - 1)
}, [api, initialPage])


  return (
    <div className="h-full flex flex-col">
      {/* Top bar - Fixed header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-red-500" />
          <span className="text-sm font-medium text-gray-700">PDF Document</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {numPages > 0 && (
            <span className="hidden sm:block">
              Page {currentPage} of {numPages}
            </span>
          )}
          <button
            // onClick={handleDownload}
            title="Download document"
            className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
          >
            <Download className="size-3" /> Download
          </button>
          <button
            // onClick={handleRetry}
            title="Retry render"
            className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      </div>

      {/* Main viewer: scrollable content area */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <Document
        file={document.url}
        onLoadSuccess={handleDocSuccess}
        onLoadError={handleDocError}
        // loading={<PdfPageSkeleton pageNumber={1} progress={progress} />}
        error={<div className="p-4 text-red-600 text-sm">Failed to load PDF.</div>}
        noData={<div className="p-4 text-gray-500 text-sm">No PDF file.</div>}
      >
        <Carousel
          setApi={setApi}
          opts={{ align: 'start', loop: false }}
          className="relative w-full h-full"
        >
          <CarouselContent className="h-full">
            {numPages > 0 && Array.from({ length: numPages }).map((_, i) => {
              const pageNumber = i + 1
              const pageFields = fieldsByPage.get(pageNumber) || []
              console.log('pageFields', pageFields)
              return (
                <CarouselItem key={pageNumber} className="h-full flex items-center justify-center bg-gray-100">
                  <div
                    className="shadow-lg max-w-full max-h-full relative"
                    ref={(el) => { if (el) containerRefs.current.set(pageNumber, el) }}
                  >
                  
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      renderMode="canvas"
                      onLoadSuccess={() => {}}
                      onLoadError={(e: any) => console.error('Page load error', pageNumber, e)}
                    />
                    {pageFields.length > 0 && (
                      <HighlightOverlay
                        width={containerRefs.current.get(pageNumber)?.clientWidth || 0}
                        height={containerRefs.current.get(pageNumber)?.clientHeight || 0}
                        boxes={pageFields.map((f: ExtractedField) => f.provenance.bbox!).filter(Boolean)}
                        overlayFields={pageFields}
                        onClickBox={(field: ExtractedField, boxIndex: number) => {
                          console.log('Clicked field:', field);
                          console.log('Box index:', boxIndex);
                          
                          // Call original callback if provided
                          if (onHighlightClick) {
                            onHighlightClick(field);
                          }
                        }}
                        documentType="pdf"
                        opacity={0.25}
                        color="#f59e0b"
                        showLabels={false}
                      />
                    )}
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious className="left-2 z-10 cursor-pointer" />
          <CarouselNext className="right-2 z-10 cursor-pointer" />
        </Carousel>
      </Document>
      </div>
    </div>
  )
}

export default PdfViewer
