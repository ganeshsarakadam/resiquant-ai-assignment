
'use client';

import { Document as DocType, ExtractedField } from "@/types";
import { FileSpreadsheet, Download, RefreshCw } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSelectionUrlState } from "@/hooks/useSelectionUrlState";
import type * as XLSX from 'xlsx-js-style';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { HighlightOverlay } from './HighlightOverlay';

interface SheetViewerProps {
  document: DocType;
  extractedFields?: ExtractedField[];
  onReady?: (info: { pageCount: number }) => void;
  onError?: (error: Error) => void;
  onHighlightClick?: (field: ExtractedField) => void;
}

interface SheetData {
  name: string;
  data: any[][];
  colWidths?: number[];
  rowHeights?: number[];
  merges?: XLSX.Range[];
}

/**
 * Yield to browser to prevent blocking the main thread
 * @returns void
 * @description This is the yieldToBrowser function that yields to the browser to prevent blocking the main thread
 */
const yieldToBrowser = async () => {
  if (typeof (window as any).requestIdleCallback === 'function') {
    await new Promise(res => (window as any).requestIdleCallback(res, { timeout: 60 }));
  } else {
    await new Promise(res => setTimeout(res, 0));
  }
};

/**
 * Memoized table to prevent re-renders unless sheet data or fields change
 * @param param0 
 * @returns 
 * @description This is the SheetTable component that renders the table
 */
const SheetTable = React.memo(({
  sheet,
  extractedFields = [],
  onHighlightClick,
  decodeCell
}: {
  sheet: SheetData;
  extractedFields?: ExtractedField[];
  onHighlightClick?: (field: ExtractedField) => void;
  decodeCell?: (addr: string) => { r: number; c: number };
}) => {
  /**
   * Set the initial number of visible rows
   * @returns void
   * @description This is the visibleRows state that sets the initial number of visible rows
   */
  const [visibleRows, setVisibleRows] = useState(100); 

  /**
   * Set the container reference
   * @returns void
   * @description This is the containerRef state that sets the container reference
   */
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Set the table reference
   * @returns void
   * @description This is the tableRef state that sets the table reference
   */
  const tableRef = useRef<HTMLTableElement>(null);

  /**
   * Set the container size
   * @returns void
   * @description This is the containerSize state that sets the container size
   */
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  /**
   * Set the cell widths
   * @returns void
   * @description This is the cellWidths state that sets the cell widths
   */
  const [cellWidths, setCellWidths] = useState<number[]>([]);
  const [cellHeights, setCellHeights] = useState<number[]>([]);
  const [totalTableHeight, setTotalTableHeight] = useState(0);
  const [totalTableWidth, setTotalTableWidth] = useState(0);
  const [containerPadding, setContainerPadding] = useState({ left: 0, top: 0 });


  /**
   * Update container size and cell dimensions
   * @returns void
   * @description This is the useEffect hook that updates the container size and cell dimensions when the container or table reference changes
   */
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      if (!containerRef.current || !tableRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const rows = tableRef.current.querySelectorAll('tr');
      const newCellHeights = Array.from(rows).map(r => (r as HTMLTableRowElement).getBoundingClientRect().height);
      const newTotalTableHeight = newCellHeights.reduce((sum, h) => sum + h, 0);
      const firstRowCells = rows[0]?.querySelectorAll('td') || [];
      const newCellWidths = Array.from(firstRowCells).map(c => (c as HTMLTableCellElement).getBoundingClientRect().width);
      const newTotalTableWidth = newCellWidths.reduce((sum, w) => sum + w, 0);
      const style = window.getComputedStyle(containerRef.current);
      setContainerPadding({ left: parseFloat(style.paddingLeft) || 0, top: parseFloat(style.paddingTop) || 0 });
      setContainerSize({ width: clientWidth, height: clientHeight });
      setCellWidths(newCellWidths.length ? newCellWidths : (sheet.colWidths?.map(w => (w || 8) * 7) || Array(sheet.data[0]?.length || 1).fill(80)));
      setCellHeights(newCellHeights.length ? newCellHeights : (sheet.rowHeights?.map(h => (h || 20) * 4 / 3) || Array(sheet.data.length).fill(24)));
      setTotalTableHeight(newTotalTableHeight || newCellHeights.length * 24);
      setTotalTableWidth(newTotalTableWidth || newCellWidths.length * 80);
    };
    frame = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      if (containerRef.current) ro.unobserve(containerRef.current);
    };
  }, [sheet.colWidths, sheet.rowHeights, sheet.data]);

  /**
   * If the sheet data is empty, return a message
   * @returns void
   * @description This is the SheetTable component that returns a message if the sheet data is empty
   */
  if (!sheet.data.length) {
    return <div className="flex items-center justify-center h-full text-gray-500">Empty sheet</div>;
  }

  const maxColumns = Math.max(...sheet.data.map(r => r.length));
  const displayData = sheet.data.slice(0, visibleRows);

  /**
   * @returns void
   * @description This is the excelBoxes state that calculates the excel boxes for the extracted fields based on the cell range
   */
  const excelBoxes: [number, number, number, number][] = extractedFields
    .map(f => {
      const cellRange = f.provenance.cellRange as any;
      if (!cellRange || !Array.isArray(cellRange) || cellRange.length !== 2) return null;
      try {
        const [, end] = cellRange as [string, string];
        if (!decodeCell) return null;
        const { r, c } = decodeCell(end);
        const box: [number, number, number, number] = [r, c, 1, 1];
        if (box[0] >= displayData.length || box[1] >= maxColumns) return null;
        return box;
      } catch {
        return null;
      }
    })
    .filter((b): b is [number, number, number, number] => !!b);

  const canLoadMore = visibleRows < sheet.data.length;

  if (sheet.merges) {
    excelBoxes.forEach(box => {
      const [row, col, rowSpan, colSpan] = box;
      sheet.merges!.forEach(m => {
        if (row >= m.s.r && row <= m.e.r && col >= m.s.c && col <= m.e.c) {
          box[2] = Math.max(rowSpan, m.e.r - m.s.r + 1);
          box[3] = Math.max(colSpan, m.e.c - m.s.c + 1);
        }
      });
    });
  }

  return (
    <div className="h-full overflow-auto bg-white p-4 relative" ref={containerRef} style={{ contentVisibility: 'auto', contain: 'layout paint style' }}>
      <div className="inline-block min-w-full align-top">
        <table ref={tableRef} className="border-collapse border border-gray-300 text-sm table-fixed">
          <tbody>
            {displayData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: maxColumns }, (_, colIndex) => {
                  const cellValue = row[colIndex] || '';
                  return (
                    <td
                      key={colIndex}
                      className="border cursor-pointer border-gray-300 px-2 py-1 min-w-[80px] max-w-[200px] break-words"
                      style={{
                        backgroundColor: rowIndex === 0 ? '#f8f9fa' : 'white',
                        fontWeight: rowIndex === 0 ? 'bold' : 'normal',
                        width: cellWidths[colIndex] ? `${cellWidths[colIndex]}px` : '80px',
                        height: cellHeights[rowIndex] ? `${cellHeights[rowIndex]}px` : '24px',
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
        {canLoadMore && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => setVisibleRows(v => Math.min(v + 300, sheet.data.length))}
              className="px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-gray-50 shadow-sm"
            >
              Load more rows ({visibleRows}/{sheet.data.length})
            </button>
          </div>
        )}
      </div>
      {containerSize.width > 0 && containerSize.height > 0 && excelBoxes.length > 0 && (
        <div className="pointer-events-none absolute top-0 left-0">
          <HighlightOverlay
            width={totalTableWidth || containerSize.width}
            height={totalTableHeight || containerSize.height}
            boxes={excelBoxes}
            overlayFields={extractedFields}
            onClickBox={onHighlightClick}
            documentType="xlsx"
            cellWidths={cellWidths}
            cellHeights={cellHeights}
            columnCount={maxColumns}
            rowCount={displayData.length}
            totalTableHeight={totalTableHeight}
            totalTableWidth={totalTableWidth}
            offsetX={containerPadding.left}
            offsetY={containerPadding.top}
            opacity={0.25}
            color="#f59e0b"
            showLabels={false}
          />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => (
  prevProps.sheet === nextProps.sheet &&
  prevProps.extractedFields === nextProps.extractedFields &&
  prevProps.onHighlightClick === nextProps.onHighlightClick
));

const normalizeCell = (v: any) => String(v ?? '').replace(/[\u00A0\t\r\n]+/g, ' ').trim();
const splitOnDelimiter = (s: string) => {
  const i = s.indexOf(':');
  if (i > 0 && i < s.length - 1) {
    const left = normalizeCell(s.slice(0, i));
    const right = normalizeCell(s.slice(i + 1));
    if (left && right) return { key: left, value: right };
  }
  return null;
};
const isKeyLike = (s: string) => !!s && s.length <= 60 && /[A-Za-z]/.test(s) && !/^\d+$/.test(s);
const isValueLike = (s: string) => !!s && (s.length > 2 || /[@:/\\]|^[$€£]?\s*[+-]?(\d{1,3}(,\d{3})*|\d+)(\.\d+)?\s*(%|USD|EUR|GBP)?$/i.test(s));

function normalizeSheetToTable(rows: any[][]): any[][] {
  const out: any[][] = [];
  let r = 0;
  while (r < rows.length) {
    const row = rows[r] || [];
    const cells = row.map(normalizeCell);
    const nonEmptyIdx = cells.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
    if (nonEmptyIdx.length === 0) {
      r += 1;
      continue;
    }

    const emitWithContinuations = (pair: [string, string]) => {
      let value = pair[1];
      let rr = r + 1;
      while (rr < rows.length) {
        const next = (rows[rr] || []).map(normalizeCell);
        const nextNonEmpty = next.filter(Boolean);
        if (nextNonEmpty.length === 0) break;
        if (!next[0] && nextNonEmpty.length >= 1) {
          value += '\n' + nextNonEmpty.join(' ');
          rr += 1;
          continue;
        }
        break;
      }
      out.push([pair[0], value]);
      r = rr;
    };

    let matched = false;

    if (!matched && nonEmptyIdx.length === 1) {
      const c = cells[nonEmptyIdx[0]];
      const split = splitOnDelimiter(c);
      if (split && isKeyLike(split.key) && isValueLike(split.value)) {
        emitWithContinuations([split.key, split.value]);
        matched = true;
      }
    }

    if (!matched && nonEmptyIdx.length === 2) {
      const [i1, i2] = nonEmptyIdx;
      const left = cells[i1];
      const right = cells[i2];
      const split = splitOnDelimiter(left);
      if (split && isKeyLike(split.key) && isValueLike(split.value || right)) {
        out.push([split.key, split.value || right]);
        r += 1; matched = true;
      } else if (isKeyLike(left) && isValueLike(right)) {
        out.push([left, right]);
        r += 1; matched = true;
      }
    }

    if (!matched && nonEmptyIdx.length >= 2) {
      const left = cells[nonEmptyIdx[0]];
      const remainder = nonEmptyIdx.slice(1).map(i => cells[i]).join(' ').trim();
      if (isKeyLike(left) && isValueLike(remainder)) {
        out.push([left, remainder]);
        r += 1; matched = true;
      }
    }

    if (!matched) {
      out.push(cells);
      r += 1;
    }
  }
  return out;
}

export const SheetViewer = React.memo(({ document: doc, extractedFields = [], onReady, onError, onHighlightClick }: SheetViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, setPageNumber } = useSelectionUrlState();
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const hadInitialPageParamRef = useRef<boolean>(state.page != null);
  const firstSelectRef = useRef<boolean>(true);
  const initialAppliedRef = useRef<boolean>(false);
  const xlsxRef = useRef<any>(null);

  // Memoize currentSheetFields to prevent reference changes
  const currentSheetFields = useMemo(
    () => extractedFields.filter(f => f.provenance?.page === currentIndex + 1),
    [extractedFields, currentIndex]
  );

  useEffect(() => {
    let isMounted = true;

    const controller = new AbortController();
    async function loadWorkbook() {
      try {
        setIsLoading(true);
        setError(null);
        hadInitialPageParamRef.current = state.page != null;
        firstSelectRef.current = true;
        initialAppliedRef.current = false;

        // Dynamically import XLSX to avoid blocking initial load of other doc types
        if (!xlsxRef.current) {
          xlsxRef.current = await import('xlsx-js-style');
        }
        const XLSXMod: typeof XLSX = xlsxRef.current;

        let buffer: ArrayBuffer;
        if (typeof doc.url === 'string') {
          const response = await fetch(doc.url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
          buffer = await response.arrayBuffer();
        } else {
          buffer = await (doc.url as File).arrayBuffer();
        }

        // Yield before heavy parse
        await yieldToBrowser();
        const workbook = XLSXMod.read(buffer, { type: 'array' });

        const sheetData: SheetData[] = [];
        for (let i = 0; i < workbook.SheetNames.length; i++) {
          const sheetName = workbook.SheetNames[i];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSXMod.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as any[][];
          const colWidths = worksheet['!cols']?.map(col => col.wch || 8);
          const rowHeights = worksheet['!rows']?.map(row => row.hpt || 20);
          const merges = worksheet['!merges'];
          sheetData.push({ name: sheetName, data, colWidths, rowHeights, merges });
          // Yield between sheets to keep UI responsive
          if (i < workbook.SheetNames.length - 1) await yieldToBrowser();
        }

        if (!isMounted) return;

        setSheets(sheetData);
        setCurrentIndex(0);
        setIsLoading(false);

        try {
          onReady?.({ pageCount: sheetData.length });
        } catch (cbErr) {
          console.warn('[SheetViewer] onReady callback error', cbErr);
        }

        if (api) {
          try {
            api.reInit();
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
    return () => { isMounted = false; controller.abort(); };
  }, [doc.url, onReady, onError]);

  useEffect(() => {
    if (api && sheets.length) {
      try { api.reInit(); } catch (e) { console.warn('[SheetViewer] api.reInit failed', e); }
    }
  }, [api, sheets.length]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      const desired = idx + 1;
      if (firstSelectRef.current && hadInitialPageParamRef.current && !initialAppliedRef.current) {
        return;
      }
      if (firstSelectRef.current) {
        firstSelectRef.current = false;
      }
      if (state.page !== desired) {
        setPageNumber(desired);
      }
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
      if (state.page !== clamped + 1) {
        setPageNumber(clamped + 1);
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

  return (
    <div className="h-full flex flex-col">
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

          <div className="flex-1 overflow-auto bg-gray-100">
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
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700">
                            Sheet: {sheet.name}
                            </h3>
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
}, (prev, next) => {
  return (
    prev.document === next.document &&
    prev.extractedFields === next.extractedFields &&
    prev.onReady === next.onReady &&
    prev.onError === next.onError &&
    prev.onHighlightClick === next.onHighlightClick
  );
});
