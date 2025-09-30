
'use client'

import { memo, useMemo, useRef, useEffect } from 'react';
import { ExtractedField } from '@/types';
import { useHighlightedField, useHighlightSetter } from '@/contexts/HighlightContext';

// For PDF/DOCX: normalized bounding boxes [x, y, width, height] as percentages (0-1)
type NormalizedBBox = [number, number, number, number];

// For Excel: cell coordinates [row, col, rowSpan, colSpan]
type ExcelCellRange = [number, number, number, number];

interface HighlightOverlayProps {
  width: number | undefined;
  height: number | undefined;
  boxes: NormalizedBBox[] | ExcelCellRange[];
  color?: string;
  opacity?: number;
  overlayFields: ExtractedField[];
  onClickBox?: (field: ExtractedField, boxIndex: number) => void;
  documentType: 'pdf' | 'docx' | 'xlsx';
  cellWidths?: number[];
  cellHeights?: number[];
  columnCount?: number;
  rowCount?: number;
  totalTableHeight?: number; // Added for full table height
  isActive?: boolean;
  showLabels?: boolean;
  totalTableWidth?: number;
  offsetX?: number; // left offset (e.g., container padding)
  offsetY?: number; // top offset
}

/**
 * Convert Excel cell coordinates to normalized (0-1) box relative to the FULL table dimensions
 * (not just the visible scroll container). This ensures highlight boxes align exactly with cell
 * boundaries even when horizontally/vertically scrolled.
 */
const excelToPixel = (
  row: number,
  col: number,
  rowSpan: number,
  colSpan: number,
  cellWidths: number[],
  cellHeights: number[],
  totalTableWidth: number,
  totalTableHeight: number
): NormalizedBBox => {
  if (totalTableWidth <= 0 || totalTableHeight <= 0) {
    console.warn('[HighlightOverlay] Invalid table dimensions:', { totalTableWidth, totalTableHeight });
    return [0, 0, 0, 0];
  }

  const xOffsetPx = cellWidths.slice(0, col).reduce((sum, w) => sum + (w || 80), 0);
  const yOffsetPx = cellHeights.slice(0, row).reduce((sum, h) => sum + (h || 24), 0);
  const cellWidthPx = cellWidths.slice(col, col + colSpan).reduce((sum, w) => sum + (w || 80), 0);
  const cellHeightPx = cellHeights.slice(row, row + rowSpan).reduce((sum, h) => sum + (h || 24), 0);

  const x = xOffsetPx / totalTableWidth;
  const y = yOffsetPx / totalTableHeight;
  const width = cellWidthPx / totalTableWidth;
  const height = cellHeightPx / totalTableHeight;

  // Debug trace (can be removed or gated later)
  // // console.log('[HighlightOverlay] Excel cell normalized:', {
  //   row, col, rowSpan, colSpan,
  //   xPct: (x * 100).toFixed(2) + '%',
  //   yPct: (y * 100).toFixed(2) + '%',
  //   wPct: (width * 100).toFixed(2) + '%',
  //   hPct: (height * 100).toFixed(2) + '%'
  // });

  return [x, y, width, height];
};

/**
 * Validate that a bounding box has valid dimensions
 */
const validateBox = (box: NormalizedBBox): boolean => {
  const isValid = box.every(val => typeof val === 'number' && val >= 0 && val <= 1);
  if (!isValid) {
    console.warn('[HighlightOverlay] Invalid box filtered:', box);
  }
  return isValid;
};

export const HighlightOverlay = memo(({
  width = 0,
  height = 0,
  boxes,
  color = '#3b82f6',
  opacity = 0.3,
  overlayFields,
  onClickBox,
  documentType,
  cellWidths = [],
  cellHeights = [],
  columnCount = 10,
  rowCount = 100,
  totalTableHeight = 0,
  totalTableWidth = 0,
  isActive = false,
  showLabels = false,
  offsetX = 0,
  offsetY = 0
}: HighlightOverlayProps) => {
  const highlightedField = useHighlightedField();
  const highlightField = useHighlightSetter();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync overlay with table scroll
  useEffect(() => {
    const container = overlayRef.current?.parentElement;
    if (!container) return;

    const handleScroll = () => {
      if (overlayRef.current) {
        // Use negative scroll offsets to align with scrolled content
        overlayRef.current.style.transform = `translate(-${container.scrollLeft}px, -${container.scrollTop}px)`;
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial sync
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Convert & validate boxes
  const normalizedBoxes = useMemo(() => {
    // console.log('[HighlightOverlay] Input boxes:', boxes);
    if (!boxes || boxes.length === 0) {
      // console.log('[HighlightOverlay] No boxes provided');
      return [] as NormalizedBBox[];
    }
    if (documentType === 'xlsx') {
      const tableWidth = totalTableWidth || cellWidths.reduce((s, w) => s + (w || 80), 0);
      const tableHeight = totalTableHeight || cellHeights.reduce((s, h) => s + (h || 24), 0);
      return (boxes as ExcelCellRange[])
        .map((b, i) => {
          const [row, col, rowSpan, colSpan] = b;
          if ([row, col, rowSpan, colSpan].every(v => typeof v === 'number')) {
            return excelToPixel(row, col, rowSpan, colSpan, cellWidths, cellHeights, tableWidth, tableHeight);
          }
          console.warn('[HighlightOverlay] Invalid Excel bbox at index', i, b);
          return null;
        })
        .filter((b): b is NormalizedBBox => !!b)
        .filter(validateBox);
    }
    return (boxes as NormalizedBBox[]).filter(validateBox);
  }, [boxes, documentType, cellWidths, cellHeights, totalTableWidth, totalTableHeight]);

  const handleBoxClick = (boxIndex: number) => {
    const field = overlayFields[boxIndex];
    if (field) {
      highlightField(field);
      if (onClickBox) {
        onClickBox(field, boxIndex);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, boxIndex: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const field = overlayFields[boxIndex];
      if (field) {
        highlightField(field);
        if (onClickBox) {
          onClickBox(field, boxIndex);
        }
      }
    }
  };

  // For xlsx we want overlay sized to full table dimensions so percentage math is accurate.
  const overlayWidth = documentType === 'xlsx' && totalTableWidth ? totalTableWidth : width;
  const overlayHeight = documentType === 'xlsx' && totalTableHeight ? totalTableHeight : height;

  return (
    <div
      ref={overlayRef}
      className="absolute pointer-events-auto z-10 border border-dashed border-gray-300"
      style={{ width: overlayWidth, height: overlayHeight, left: offsetX, top: offsetY }}
      aria-label={`Highlight overlay for ${overlayFields.length} fields`}
    >
      {normalizedBoxes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
          No valid highlight boxes
        </div>
      ) : (
        normalizedBoxes.map((box, index) => {
          const field = overlayFields[index];
          const isHighlighted = highlightedField?.id === field?.id;
          const fieldName = field?.name || `Field ${index + 1}`;
          return (
            <div
              key={field?.id || index}
              className={`absolute cursor-pointer transition-all duration-100 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isHighlighted ? 'ring-2 ring-offset-1 ring-blue-500 ring-opacity-80 border border-blue-300' : 'border border-transparent hover:border-blue-200'}
              `}
              style={{
                left: `${box[0] * 100}%`,
                top: `${box[1] * 100}%`,
                width: `${box[2] * 100}%`,
                height: `${box[3] * 100}%`,
                backgroundColor: isHighlighted ? color : 'transparent',
                opacity: isHighlighted ? opacity : 1,
                boxShadow: isHighlighted ? '0 0 0 2px rgba(59,130,246,0.4), 0 0 4px rgba(0,0,0,0.15)' : 'none'
              }}
              onClick={() => handleBoxClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-pressed={isHighlighted}
              aria-label={`Highlight for ${fieldName}`}
              title={`${fieldName}${showLabels ? ` – ${documentType.toUpperCase()}` : ''}`}
            >
              {showLabels && (
                <span className="absolute -top-5 left-0 text-[10px] bg-black/60 text-white px-1 py-0.5 rounded">
                  {fieldName}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
});

HighlightOverlay.displayName = 'HighlightOverlay';
