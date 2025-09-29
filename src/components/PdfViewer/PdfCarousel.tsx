'use client'

import { useState, useEffect, useRef } from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel'
import { PdfPage } from './PdfPage'
import type { ExtractedField } from '@/types'

interface PdfCarouselProps {
  numPages: number
  fieldsByPage: Map<number, ExtractedField[]>
  initialPage: number
  onHighlightClick?: (field: ExtractedField) => void
  onPageChange?: (page: number) => void
}

export const PdfCarousel = ({ 
  numPages, 
  fieldsByPage, 
  initialPage, 
  onHighlightClick, 
  onPageChange 
}: PdfCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  // Handle carousel selection events
  useEffect(() => {
    if (!api) return;
    const handleSelect = () => {
      const idx = api.selectedScrollSnap();
      const newPage = idx + 1;
      if (newPage !== currentPage) {
        console.log('[PdfCarousel] Carousel select -> updating page', { from: currentPage, to: newPage });
        setCurrentPage(newPage);
        try { onPageChange?.(newPage); } catch (e) { console.warn('[PdfCarousel] onPageChange error', e); }
      } else {
        console.log('[PdfCarousel] Carousel select -> no change (same page)', newPage);
      }
    };
    api.on('select', handleSelect);
    return () => { api.off('select', handleSelect); };
  }, [api, currentPage, onPageChange]);

  // Scroll to initial page when API is ready
  useEffect(() => {
    if (!api) return
    api.scrollTo(initialPage - 1)
  }, [api, initialPage])

  return (
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
              <PdfPage
                pageNumber={pageNumber}
                pageFields={pageFields}
                onHighlightClick={onHighlightClick}
              />
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="left-2 z-10 cursor-pointer" />
      <CarouselNext className="right-2 z-10 cursor-pointer" />
    </Carousel>
  )
}
