'use client';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { ExtractedField } from '@/types';
import { PageSlide } from './PageSlide';
import React from 'react';

interface PageCarouselProps {
  pages: HTMLElement[];
  fieldsByPage: Map<number, ExtractedField[]>;
  setApi: (api: CarouselApi) => void;
  api: CarouselApi | undefined;
  showArrows: boolean;
  onHighlightClick?: (field: ExtractedField) => void;
}

export function PageCarousel({ pages, fieldsByPage, setApi, api, showArrows, onHighlightClick }: PageCarouselProps) {
  if (!pages.length) return null;
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <Carousel
          setApi={setApi}
          className="relative w-full h-full"
          opts={{ align: 'center', loop: false, skipSnaps: false, dragFree: false }}
        >
          <CarouselContent className="h-full">
            {pages.map((node: HTMLElement, idx: number) => (
              <CarouselItem key={idx}>
                <PageSlide
                  node={node}
                  index={idx}
                  pageFields={fieldsByPage.get(idx + 1) || []}
                  onHighlightClick={onHighlightClick}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {showArrows && (
            <>
              <CarouselPrevious className="left-2 z-20 cursor-pointer" />
              <CarouselNext className="right-2 z-20 cursor-pointer" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
}
