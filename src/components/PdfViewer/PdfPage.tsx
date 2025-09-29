'use client'

import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { HighlightOverlay } from '../HighlightOverlay'
import type { ExtractedField } from '@/types'

// Dynamically import Page component from react-pdf
const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false })

interface PdfPageProps {
  pageNumber: number
  pageFields: ExtractedField[]
  onHighlightClick?: (field: ExtractedField) => void
}

export const PdfPage = ({ pageNumber, pageFields, onHighlightClick }: PdfPageProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Update container size when the page loads or resizes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        console.log(`[PdfPage ${pageNumber}] Container size:`, { clientWidth, clientHeight })
        setContainerSize({ width: clientWidth, height: clientHeight })
      }
    }

    // Initial size check
    updateSize()
    
    // Set up resize observer
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [pageNumber])

  const handlePageLoadSuccess = () => {
    // Trigger size update after page loads
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current
      console.log(`[PdfPage ${pageNumber}] Page loaded, size:`, { clientWidth, clientHeight })
      setContainerSize({ width: clientWidth, height: clientHeight })
    }
  }

  return (
    <div
      className="shadow-lg max-w-full max-h-full relative"
      ref={containerRef}
    >
      <Page
        pageNumber={pageNumber}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        renderMode="canvas"
        onLoadSuccess={handlePageLoadSuccess}
        onLoadError={(e: any) => console.error('Page load error', pageNumber, e)}
      />
      {pageFields.length > 0 && containerSize.width > 0 && containerSize.height > 0 && (
        <HighlightOverlay
          width={containerSize.width}
          height={containerSize.height}
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
  )
}
