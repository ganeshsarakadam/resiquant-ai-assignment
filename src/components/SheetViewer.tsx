'use client';

import { Document as DocType } from "@/types";
import { FileSpreadsheet, Download, RefreshCw } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import * as XLSX from 'xlsx-js-style';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface SheetViewerProps {
  document: DocType;
  onReady?: (info: { pageCount: number }) => void;
  onError?: (error: Error) => void;
}

interface SheetData {
  name: string;
  data: any[][];
}

// Memoized table to prevent re-renders unless sheet data reference changes
const SheetTable = ({ sheet }: { sheet: SheetData }) => {
  if (!sheet.data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Empty sheet
      </div>
    );
  }
  const maxColumns = Math.max(...sheet.data.map(row => row.length));
  const displayData = sheet.data.slice(0, 1000);
  return (
    <div className="h-full overflow-auto bg-white p-4">
      <div className="max-w-full">
        <table className="border-collapse border border-gray-300 text-sm">
          <tbody>
            {displayData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: maxColumns }, (_, colIndex) => {
                  const cellValue = row[colIndex] || '';
                  return (
                    <td
                      key={colIndex}
                      className="border border-gray-300 px-2 py-1 min-w-[80px] max-w-[200px] break-words"
                      style={{
                        backgroundColor: rowIndex === 0 ? '#f8f9fa' : 'white',
                        fontWeight: rowIndex === 0 ? 'bold' : 'normal'
                      }}
                    >
                      {String(cellValue)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {sheet.data.length > 1000 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing first 1000 rows of {sheet.data.length} total rows
          </div>
        )}
      </div>
    </div>
  );
};

const MemoSheetTable = React.memo(SheetTable);

export const SheetViewer = ({ document: doc, onReady, onError }: SheetViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL state integration
  const { state, setPageNumber } = useSelectionUrlState();

  // Sheets data and navigation
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs to manage initial sync logic
  const hadInitialPageParamRef = useRef<boolean>(state.page != null);
  const firstSelectRef = useRef<boolean>(true);
  const initialAppliedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkbook() {
      try {
        console.log('[SheetViewer] start loadWorkbook()', { url: doc.url, hadInitialPage: state.page });
        setIsLoading(true);
        setError(null);
        hadInitialPageParamRef.current = state.page != null;
        firstSelectRef.current = true;
        initialAppliedRef.current = false;

        // Fetch the Excel file
        let buffer: ArrayBuffer;
        if (typeof doc.url === 'string') {
          const response = await fetch(doc.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
          }
          buffer = await response.arrayBuffer();
        } else {
          buffer = await (doc.url as File).arrayBuffer();
        }

        console.log('[SheetViewer] fetched buffer, parsing with xlsx');
        
        // Parse the workbook
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        // Extract all sheets
        const sheetData: SheetData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          // Convert to 2D array with headers
          const data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '', 
            raw: false 
          }) as any[][];
          
          return {
            name: sheetName,
            data: data
          };
        });

        console.log('[SheetViewer] parsed sheets', { count: sheetData.length, names: sheetData.map(s => s.name) });

        if (!isMounted) return;

        setSheets(sheetData);
        setCurrentIndex(0);
        setIsLoading(false);

        console.log('[SheetViewer] sheets state set, isLoading=false');
        
        // Fire onReady callback
        try {
          onReady?.({ pageCount: sheetData.length });
        } catch (cbErr) {
          console.warn('[SheetViewer] onReady callback error', cbErr);
        }

        // Reinitialize carousel if it exists
        if (api) {
          try { 
            api.reInit(); 
            console.log('[SheetViewer] api.reInit after sheets set'); 
          } catch (e) { 
            console.warn('[SheetViewer] api.reInit failed', e); 
          }
        }

      } catch (err) {
        console.error("Error loading spreadsheet:", err);
        const e = err instanceof Error ? err : new Error('Failed to load spreadsheet');
        if (isMounted) {
          setError(e.message);
          setIsLoading(false);
        }
        try { 
          onError?.(e); 
        } catch (cbErr) { 
          console.warn('[SheetViewer] onError callback error', cbErr); 
        }
      }
    }

    loadWorkbook();
    return () => { isMounted = false; };
  }, [doc.url, onReady, onError]);

  // Reinitialize carousel only when slides (sheets) count changes and api available
  useEffect(() => {
    if (api && sheets.length) {
      try { api.reInit(); console.log('[SheetViewer] api.reInit after sheets length change'); } catch(e) { console.warn('[SheetViewer] api.reInit failed', e); }
    }
  }, [api, sheets.length]);

  // Embla select -> update local index (and maybe URL) after initial sync
  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      const desired = idx + 1; // 1-based
      
      // If initial URL param existed and we haven't applied it yet, skip until URL->carousel effect runs
      if (firstSelectRef.current && hadInitialPageParamRef.current && !initialAppliedRef.current) {
        console.log('[SheetViewer] early select ignored pending initial URL scroll');
        return;
      }
      if (firstSelectRef.current) {
        firstSelectRef.current = false; // consume flag if we reach here
      }
      if (state.page !== desired) {
        setPageNumber(desired);
        console.log('[SheetViewer] onSelect -> setPageNumber', { desired });
      }
    };
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api, setPageNumber, state.page]);

  // URL -> carousel (initial + subsequent external changes)
  useEffect(() => {
    if (!api) return;
    if (!sheets.length) return; // need sheets to target
    const urlPage = state.page || 1;
    const clamped = Math.min(Math.max(urlPage, 1), sheets.length) - 1;
    const current = api.selectedScrollSnap();
    const needsScroll = current !== clamped || !initialAppliedRef.current;
    if (needsScroll) {
      const jump = !initialAppliedRef.current; // jump on first application
      api.scrollTo(clamped, jump);
      console.log('[SheetViewer] URL->carousel scrollTo', { urlPage, clamped, jump });
    }
    if (!initialAppliedRef.current) {
      initialAppliedRef.current = true;
      firstSelectRef.current = false; // we've now applied initial position; allow future selects to update URL
      setCurrentIndex(clamped);
      console.log('[SheetViewer] initialAppliedRef set true', { clamped });
      if (state.page !== clamped + 1) {
        // Normalize URL if it was out of bounds
        setPageNumber(clamped + 1);
        console.log('[SheetViewer] normalized out-of-range page param', { newPage: clamped + 1 });
      }
    }
  }, [state.page, api, sheets.length]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = doc.url as string;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [doc.url, doc.name]);

  // Removed inline renderSheetTable in favor of MemoSheetTable

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Excel Spreadsheet</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {sheets.length > 0 && (
            <span className="hidden sm:block">
              Sheet {currentIndex + 1} of {sheets.length}: {sheets[currentIndex]?.name}
            </span>
          )}
          <button
            onClick={handleDownload}
            title="Download document"
            className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
          >
            <Download className="size-3" /> Download
          </button>
          <button
            onClick={handleRetry}
            title="Retry render"
            className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white hover:bg-gray-50"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      </div>

      {/* Main viewer */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {/* Loading / Error overlays */}
        {/* {isLoading && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading spreadsheet...</p>
            </div>
          </div>
        )} */}
        
        {error && !isLoading && (
          <div className="w-full h-full flex items-center justify-center p-6 bg-white">
            <div className="max-w-sm text-center">
              <h3 className="text-sm font-semibold text-red-600 mb-2">Failed to load spreadsheet</h3>
              <p className="text-xs text-gray-600 whitespace-pre-wrap mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carousel with sheet pages */}
        {!isLoading && !error && sheets.length > 0 && (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <Carousel
                setApi={setApi}
                className="relative w-full h-full"
                opts={{ align: "center", loop: false, skipSnaps: false, dragFree: false }}
              >
                <CarouselContent className="h-full">
                  {sheets.map((sheet: SheetData, idx: number) => (
                    <CarouselItem
                      key={idx}
                      className="h-full basis-full flex flex-col"
                    >
                      <div className="flex-1 bg-white rounded-lg shadow-sm m-4 overflow-hidden">
                        {/* Sheet header */}
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700">
                            Sheet: {sheet.name}
                          </h3>
                        </div>
                        {/* Sheet content */}
                        <div className="flex-1 overflow-hidden">
                          <MemoSheetTable sheet={sheet} />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>

                {/* Navigation controls */}
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
};