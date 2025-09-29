
'use client';

import { Document as DocType, ExtractedField } from "@/types";
import { FileSpreadsheet, Download, RefreshCw } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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

// Parse cell range (e.g., ["A1", "A2"]) to ExcelCellRange [row, col, rowSpan, colSpan] for end cell only
const parseCellRange = (cellRange: [string, string]): [number, number, number, number] | null => {
  try {
    const [, end] = cellRange; // Use only the end cell (e.g., A2)
    const { r, c } = XLSX.utils.decode_cell(end);
    console.log('[SheetViewer] Parsed cell range:', { cellRange, row: r, col: c });
    return [r, c, 1, 1]; // Single cell: rowSpan=1, colSpan=1
  } catch (e) {
    console.warn('[SheetViewer] Invalid cell range:', cellRange, e);
    return null;
  }
};

// Memoized table to prevent re-renders unless sheet data or fields change
const SheetTable = React.memo(({
  sheet,
  extractedFields = [],
  onHighlightClick
}: {
  sheet: SheetData;
  extractedFields?: ExtractedField[];
  onHighlightClick?: (field: ExtractedField) => void;
}) => {
  // Log re-renders
  console.log('[SheetTable] Re-rendered with props:', {
    sheetName: sheet.name,
    fieldsCount: extractedFields.length,
    onHighlightClick: onHighlightClick?.toString()
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cellWidths, setCellWidths] = useState<number[]>([]);
  const [cellHeights, setCellHeights] = useState<number[]>([]);
  const [totalTableHeight, setTotalTableHeight] = useState(0);
  const [totalTableWidth, setTotalTableWidth] = useState(0);
  const [containerPadding, setContainerPadding] = useState({ left: 0, top: 0 });

  // Update container size and cell dimensions
  useEffect(() => {
    const updateSizes = () => {
      if (containerRef.current && tableRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        console.log('[SheetTable] Container size updated:', { clientWidth, clientHeight });

        // Measure actual row heights
        const rows = tableRef.current.querySelectorAll('tr');
        const newCellHeights = Array.from(rows).map(row => row.getBoundingClientRect().height);
        const newTotalTableHeight = newCellHeights.reduce((sum, h) => sum + h, 0);

        // Measure actual column widths (first row's <td> elements)
        const cells = rows[0]?.querySelectorAll('td') || [];
        const newCellWidths = Array.from(cells).map(cell => cell.getBoundingClientRect().width);
        const newTotalTableWidth = newCellWidths.reduce((sum, w) => sum + w, 0);

        console.log('[SheetTable] Measured dimensions:', {
          cellHeights: newCellHeights,
          cellWidths: newCellWidths,
          totalTableHeight: newTotalTableHeight,
          totalTableWidth: newTotalTableWidth
        });

        // Capture padding offset so overlay can align to table (table starts after padding)
        const style = window.getComputedStyle(containerRef.current);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingTop = parseFloat(style.paddingTop) || 0;
        setContainerPadding({ left: paddingLeft, top: paddingTop });

        setContainerSize({ width: clientWidth, height: clientHeight });
        setCellWidths(newCellWidths.length > 0 ? newCellWidths : (sheet.colWidths?.map(w => (w || 8) * 7) || Array(sheet.data[0]?.length || 1).fill(80)));
        setCellHeights(newCellHeights.length > 0 ? newCellHeights : (sheet.rowHeights?.map(h => (h || 20) * 4 / 3) || Array(sheet.data.length).fill(24)));
        setTotalTableHeight(newTotalTableHeight || newCellHeights.length * 24);
        setTotalTableWidth(newTotalTableWidth || newCellWidths.length * 80);
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    const observer = new ResizeObserver(updateSizes);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', updateSizes);
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [sheet.colWidths, sheet.rowHeights, sheet.data]);

  if (!sheet.data.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Empty sheet
      </div>
    );
  }

  const maxColumns = Math.max(...sheet.data.map(row => row.length));
  const displayData = sheet.data.slice(0, 1000);

  // Convert cellRange to ExcelCellRange [row, col, rowSpan, colSpan]
  const excelBoxes: [number, number, number, number][] = extractedFields
    .map((f) => {
      const cellRange = f.provenance.cellRange;
      if (!cellRange || !Array.isArray(cellRange) || cellRange.length !== 2) {
        console.warn('[SheetTable] Missing or invalid cellRange:', f);
        return null;
      }
      const box = parseCellRange(cellRange);
      if (box && (box[0] >= displayData.length || box[1] >= maxColumns)) {
        console.warn('[SheetTable] Cell range out of bounds:', { cellRange, row: box[0], col: box[1], maxRows: displayData.length, maxCols: maxColumns });
        return null;
      }
      return box;
    })
    .filter((b): b is [number, number, number, number] => !!b);

  // Adjust for merged cells
  if (sheet.merges) {
    excelBoxes.forEach((box) => {
      const [row, col, rowSpan, colSpan] = box;
      sheet.merges!.forEach(merge => {
        if (
          row >= merge.s.r && row <= merge.e.r &&
          col >= merge.s.c && col <= merge.e.c
        ) {
          box[2] = Math.max(rowSpan, merge.e.r - merge.s.r + 1);
          box[3] = Math.max(colSpan, merge.e.c - merge.s.c + 1);
          console.log('[SheetTable] Adjusted for merge:', { box, merge });
        }
      });
    });
  }

  console.log('[SheetTable] Rendering with:', {
    containerSize,
    excelBoxes,
    fieldsCount: extractedFields.length,
    sheetName: sheet.name,
    totalTableHeight,
    totalTableWidth
  });

  return (
    <div className="h-full overflow-auto bg-white p-4 relative" ref={containerRef}>
      <div className="max-w-full">
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
        {sheet.data.length > 1000 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing first 1000 rows of {sheet.data.length} total rows
          </div>
        )}
      </div>
      {containerSize.width > 0 && containerSize.height > 0 && excelBoxes.length > 0 && (
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
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    prevProps.sheet === nextProps.sheet &&
    prevProps.extractedFields === nextProps.extractedFields &&
    prevProps.onHighlightClick === nextProps.onHighlightClick
  );
});

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

  // Memoize currentSheetFields to prevent reference changes
  const currentSheetFields = useMemo(
    () => extractedFields.filter(f => f.provenance?.page === currentIndex + 1),
    [extractedFields, currentIndex]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadWorkbook() {
      try {
        setIsLoading(true);
        setError(null);
        hadInitialPageParamRef.current = state.page != null;
        firstSelectRef.current = true;
        initialAppliedRef.current = false;

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

        const workbook = XLSX.read(buffer, { type: 'array' });

        const sheetData: SheetData[] = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
          }) as any[][];
          const normalizedData = normalizeSheetToTable(data);
          const colWidths = worksheet['!cols']?.map(col => col.wch || 8);
          const rowHeights = worksheet['!rows']?.map(row => row.hpt || 20);
          const merges = worksheet['!merges'];

          return {
            name: sheetName,
            data: data,
            colWidths,
            rowHeights,
            merges,
          };
        });

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
    return () => { isMounted = false; };
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

      <div className="flex-1 overflow-hidden bg-gray-100">
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
