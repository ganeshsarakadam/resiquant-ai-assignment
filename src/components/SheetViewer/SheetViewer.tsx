"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { useSelectionUrlState } from '@/hooks/useSelectionUrlState';
import { SheetTable } from './SheetTable';
import { SheetToolbar } from './SheetToolbar';
import { SheetViewerProps } from './types';
import { useWorkbookLoader } from './useWorkbookLoader';

export const SheetViewer: React.FC<SheetViewerProps> = React.memo(function SheetViewer({ document: doc, extractedFields = [], onReady, onError, onHighlightClick }) {
  const { sheets, isLoading, error, retry, xlsxRef } = useWorkbookLoader({ document: doc, onReady, onError });
  const { state, setPageNumber } = useSelectionUrlState();
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const hadInitialPageParamRef = useRef<boolean>(state.page != null);
  const firstSelectRef = useRef<boolean>(true);
  const initialAppliedRef = useRef<boolean>(false);

  const currentSheetFields = useMemo(
    () => extractedFields.filter(f => f.provenance?.page === currentIndex + 1),
    [extractedFields, currentIndex]
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      const desired = idx + 1;
      if (firstSelectRef.current && hadInitialPageParamRef.current && !initialAppliedRef.current) {
        return;
      }
      if (firstSelectRef.current) firstSelectRef.current = false;
      if (state.page !== desired) setPageNumber(desired);
    };
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, setPageNumber, state.page]);

  useEffect(() => {
    if (!api || !sheets.length) return;
    const urlPage = state.page || 1;
    const clamped = Math.min(Math.max(urlPage, 1), sheets.length) - 1;
    const current = api.selectedScrollSnap();
    const needsScroll = current !== clamped || !initialAppliedRef.current;
    if (needsScroll) {
      const jump = !initialAppliedRef.current;
      api.scrollTo(clamped, jump);
    }
    if (!initialAppliedRef.current) {
      initialAppliedRef.current = true;
      firstSelectRef.current = false;
      setCurrentIndex(clamped);
      if (state.page !== clamped + 1) setPageNumber(clamped + 1);
    }
  }, [state.page, api, sheets.length]);

  const handleDownload = useCallback(() => {
    const a = window.document.createElement('a');
    a.href = doc.url as string;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  }, [doc.url, doc.name]);

  return (
    <div className="h-full flex flex-col">
      <SheetToolbar
        sheetCount={sheets.length}
        currentIndex={currentIndex}
        currentSheetName={sheets[currentIndex]?.name}
        onDownload={handleDownload}
        onRetry={retry}
      />
      <div className="flex-1 overflow-auto bg-gray-100">
        {!isLoading && !error && sheets.length > 0 && (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <Carousel
                setApi={setApi}
                className="relative w-full h-full"
                opts={{ align: 'center', loop: false, skipSnaps: false, dragFree: false }}
              >
                <CarouselContent className="h-full">
                  {sheets.map((sheet, idx) => (
                    <CarouselItem key={idx} className="h-full basis-full flex flex-col">
                      <div className="flex-1 bg-white rounded-lg shadow-sm m-4 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700">Sheet: {sheet.name}</h3>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <SheetTable
                            sheet={sheet}
                            extractedFields={currentSheetFields}
                            onHighlightClick={onHighlightClick}
                            decodeCell={xlsxRef.current?.utils.decode_cell}
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {sheets.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2 z-20 cursor-pointer" />
                    <CarouselNext className="right-2 z-20 cursor-pointer" />
                  </>
                )}
              </Carousel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => (
  prev.document === next.document &&
  prev.extractedFields === next.extractedFields &&
  prev.onReady === next.onReady &&
  prev.onError === next.onError &&
  prev.onHighlightClick === next.onHighlightClick
));

(SheetViewer as React.MemoExoticComponent<React.FC<SheetViewerProps>>).displayName = 'SheetViewer';
// Named export only; no default export to ensure consistent import style
