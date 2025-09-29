'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Document as DocType } from '@/types'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'
import { PdfPageSkeleton } from './Skeletons/PdfPageSkeleton'
import { HighlightOverlay } from './HighlightOverlay'
import type { ExtractionData, ExtractedField } from '@/types'
import { useSelectionUrlState } from '@/hooks/useSelectionUrlState'
import { Download, RefreshCw, File, FileText } from 'lucide-react'


// Dynamically import react-pdf components and setup to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then(async (mod) => {
    // Ensure PDF.js setup is loaded
    await import('@/lib/pdfjs-setup');
    return { default: mod.Document };
  }), 
  { ssr: false }
);

const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false });

export interface PdfViewerProps {
  document: DocType;
  initialPage?: number;
  onDocumentLoadSuccess?: (pdf: any) => void;
  onDocumentLoadError?: (error: Error) => void;
  onDocumentLoadProgress?: (ratio: number) => void;
  /** When provided, we'll attempt to load extraction JSON at /public/data/extraction_<submissionId>.json */
  submissionId?: string;
  /** Enable/disable overlay globally */

  /** Callback when a highlight is clicked */
  onHighlightClick?: (field: ExtractedField) => void;
  /** Extracted fields to overlay */
  extractedFields: ExtractedField[];
}

export const PdfViewer = ({
  document,
  extractedFields,
  initialPage = 1,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onHighlightClick,
}: PdfViewerProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set())
  const containerRefs = useRef<Map<number, HTMLDivElement>>(new Map())


console.log("pdf viewer rerendered")
  

  // // Load extraction JSON dynamically based on submissionId
  // useEffect(() => {
  //   if (!showExtractionOverlay) {
  //     setExtraction(null)
  //     return
  //   }
  //   let cancelled = false
  //   const path = `/data/extraction_${state.submissionId}.json`
  //   fetch(path)
  //     .then(r => {
  //       if (!r.ok) throw new Error(`Extraction file not found: ${path}`)
  //       return r.json()
  //     })
  //     .then((data: ExtractionData) => { if (!cancelled) setExtraction(data) })
  //     .catch(err => { console.warn('Extraction load failed', err); if (!cancelled) setExtraction(null) })
  //   return () => { cancelled = true }
  // }, [state.submissionId, showExtractionOverlay])



  // Filter extraction fields for this PDF document & page
  const fieldsByPage = useMemo(() => {
    if (!extractedFields) return new Map<number, ExtractedField[]>()
    const map = new Map<number, ExtractedField[]>()
    for (const f of extractedFields) {
      console.log('f', f, document.name)
      if (f.provenance.docName === document.name && f.provenance.bbox && f.provenance.page) {
        const arr = map.get(f.provenance.page) || []
        arr.push(f)
        map.set(f.provenance.page, arr)
      }
    }
    console.log('map', map)
    return map
  }, [extractedFields, document.name])

  const handleDocSuccess = (pdf: any) => {
    setNumPages(pdf.numPages)
    setCurrentPage(initialPage)
    onDocumentLoadSuccess?.(pdf)
    if (api) {
      api.scrollTo(initialPage - 1)
    }
  }

  const handleDocError = (err: Error) => {
    onDocumentLoadError?.(err)
  }



  const markPageLoaded = useCallback((pageNumber: number) => {
    setLoadedPages((prev: Set<number>) => {
      if (prev.has(pageNumber)) return prev
      const next = new Set(prev)
      next.add(pageNumber)
      return next
    })
  }, [])

    useEffect(() => {
    if (!api) return
    
    const handleSelect = () => {
      const idx = api.selectedScrollSnap()
      const newPage = idx + 1
      setCurrentPage(newPage)
    }
    
    api.on('select', handleSelect)
    
    // Cleanup event listener to prevent memory leaks
    return () => {
      api.off('select', handleSelect)
    }
  }, [api])

  /**
   * This is the useEffect hook that scrolls to the initial page
   * It is used to scroll to the initial page when the component mounts
   */
useEffect(() => {
  if (!api) return
  api.scrollTo(initialPage - 1)
}, [api, initialPage])


  return (
    <div className="h-full flex flex-col">
      {/* {isLoading && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <PdfPageSkeleton pageNumber={1} progress={progress} />
        </div>
      )} */}
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
              const pageLoaded = loadedPages.has(pageNumber)
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
                      onLoadSuccess={() => markPageLoaded(pageNumber)}
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
