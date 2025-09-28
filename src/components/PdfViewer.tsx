'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Document as DocType } from '@/types'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'
import { PdfPageSkeleton } from './Skeletons/PdfPageSkeleton'

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
  onPageChange?: (page: number) => void;
}

export const PdfViewer = ({
  document,
  initialPage = 1,
  onDocumentLoadSuccess,
  onDocumentLoadError,
  onDocumentLoadProgress,
  onPageChange,
}: PdfViewerProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [numPages, setNumPages] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set())
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reset when document changes
  useEffect(() => {
    setNumPages(0)
    setIsLoading(true)
    setProgress(0)
    setLoadedPages(new Set())
  }, [document.url])

  const handleDocSuccess = (pdf: any) => {
    setNumPages(pdf.numPages)
    setIsLoading(false)
    onDocumentLoadSuccess?.(pdf)
    if (api) {
      api.scrollTo(initialPage - 1)
    }
  }

  const handleDocError = (err: Error) => {
    setIsLoading(false)
    onDocumentLoadError?.(err)
  }

  const handleProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    const ratio = total ? loaded / total : 0
    setProgress(ratio)
    onDocumentLoadProgress?.(ratio)
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
    api.on('select', () => {
      const idx = api.selectedScrollSnap()
      onPageChange?.(idx + 1)
    })
  }, [api, onPageChange])

  /**
   * This is the useEffect hook that scrolls to the initial page
   * It is used to scroll to the initial page when the component mounts
   */
useEffect(() => {
  if (!api) return
  api.scrollTo(initialPage - 1)
}, [api, initialPage])


  // Show loading skeleton until client-side hydration is complete
  // if (!isClient) {
  //   return (
  //     <div className="w-full h-full relative">
  //       <PdfPageSkeleton pageNumber={1} progress={0} />
  //     </div>
  //   )
  // }

  return (
    <div className="w-full h-full relative">
      {/* {isLoading && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <PdfPageSkeleton pageNumber={1} progress={progress} />
        </div>
      )} */}
      <Document
        file={document.url}
        onLoadSuccess={handleDocSuccess}
        onLoadError={handleDocError}
        onLoadProgress={handleProgress}
        // loading={<PdfPageSkeleton pageNumber={1} progress={progress} />}
        error={<div className="p-4 text-red-600 text-sm">Failed to load PDF.</div>}
        noData={<div className="p-4 text-gray-500 text-sm">No PDF file.</div>}
      >
        <Carousel
          setApi={setApi}
          opts={{ align: 'start', loop: false }}
          className="w-full h-full relative"
        >
          <CarouselContent className="h-full">
            {numPages > 0 && Array.from({ length: numPages }).map((_, i) => {
              const pageNumber = i + 1
              const pageLoaded = loadedPages.has(pageNumber)
              return (
                <CarouselItem key={pageNumber} className="h-full flex items-center justify-center bg-gray-100">
                  <div className="shadow-lg max-w-full max-h-full relative">
                    {!pageLoaded && (
                      <div className="absolute inset-0 z-10">
                        {/* <PdfPageSkeleton pageNumber={pageNumber} /> */}
                      </div>
                    )}
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      renderMode="canvas"
                      onLoadSuccess={() => markPageLoaded(pageNumber)}
                      onLoadError={(e: any) => console.error('Page load error', pageNumber, e)}
                    />
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
  )
}

export default PdfViewer
