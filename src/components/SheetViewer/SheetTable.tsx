import React, { useEffect, useRef, useState } from 'react';
import { HighlightOverlay } from '../HighlightOverlay';
import { ExtractedField } from '@/types';
import { SheetData } from './types';

export interface SheetTableProps {
  sheet: SheetData;
  extractedFields?: ExtractedField[];
  onHighlightClick?: (field: ExtractedField) => void;
  decodeCell?: (addr: string) => { r: number; c: number };
}

export const SheetTable = React.memo(({ sheet, extractedFields = [], onHighlightClick, decodeCell }: SheetTableProps) => {
  const [visibleRows, setVisibleRows] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cellWidths, setCellWidths] = useState<number[]>([]);
  const [cellHeights, setCellHeights] = useState<number[]>([]);
  const [totalTableHeight, setTotalTableHeight] = useState(0);
  const [totalTableWidth, setTotalTableWidth] = useState(0);
  const [containerPadding, setContainerPadding] = useState({ left: 0, top: 0 });

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

  if (!sheet.data.length) {
    return <div className="flex items-center justify-center h-full text-gray-500">Empty sheet</div>;
  }

  const maxColumns = Math.max(...sheet.data.map(r => r.length));
  const displayData = sheet.data.slice(0, visibleRows);

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
}, (prev, next) => (
  prev.sheet === next.sheet &&
  prev.extractedFields === next.extractedFields &&
  prev.onHighlightClick === next.onHighlightClick
));
