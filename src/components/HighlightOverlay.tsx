'use client'

import { memo, useMemo } from 'react';

import { ExtractedField } from '@/types';
import { useHighlight } from '@/contexts/HighlightContext';

// For PDF/DOCX: normalized bounding boxes [x, y, width, height] as percentages (0-1)
type NormalizedBBox = [number, number, number, number];

// For Excel: cell coordinates [row, col, rowSpan, colSpan]
type ExcelCellRange = [number, number, number, number];

interface HighlightOverlayProps {
  width: number;
  height: number;
  boxes: NormalizedBBox[] | ExcelCellRange[];
  color?: string;
  opacity?: number;
  overlayFields: ExtractedField[];
  onClickBox?: (field: ExtractedField, boxIndex: number) => void;
  documentType: 'pdf' | 'docx' | 'xlsx';
  cellWidth?: number;
  cellHeight?: number;
  columnCount?: number;
  rowCount?: number;
  // Optional enhancements
  isActive?: boolean;
  showLabels?: boolean;
}

/**
 * Convert Excel cell coordinates to normalized pixel coordinates
 */
const excelToPixel = (
  row: number,
  col: number,
  rowSpan: number,
  colSpan: number,
  cellWidth: number,
  cellHeight: number,
  containerWidth: number,
  containerHeight: number
): NormalizedBBox => {
  const x = (col * cellWidth) / containerWidth;
  const y = (row * cellHeight) / containerHeight;
  const width = (colSpan * cellWidth) / containerWidth;
  const height = (rowSpan * cellHeight) / containerHeight;
  
  return [x, y, width, height];
};

/**
 * Validate that a bounding box has valid dimensions
 */
const validateBox = (box: NormalizedBBox): boolean => {
  return box.every(val => typeof val === 'number' && val >= 0 && val <= 1);
};

export const HighlightOverlay = memo(({
  width,
  height,
  boxes,
  color = '#3b82f6',
  opacity = 0.3,
  overlayFields,
  onClickBox,
  documentType,
  cellWidth = 80,
  cellHeight = 20,
  columnCount = 10,
  rowCount = 100,
  isActive = false,
  showLabels = false
}: HighlightOverlayProps) => {
  const { highlightField, highlightedField } = useHighlight();

  // Convert & validate boxes. Show ALL boxes for current page; style active one differently.
  const normalizedBoxes = useMemo(() => {
    if (!boxes || boxes.length === 0) return [] as NormalizedBBox[];
    if (documentType === 'xlsx') {
      return (boxes as ExcelCellRange[])
        .map(b => excelToPixel(b[0], b[1], b[2], b[3], cellWidth, cellHeight, width, height))
        .filter(validateBox);
    }
    return (boxes as NormalizedBBox[]).filter(validateBox);
  }, [boxes, documentType, cellWidth, cellHeight, width, height]);

  const handleBoxClick = (boxIndex: number) => {
    const field = overlayFields[boxIndex];
    if (field) {
      // Use context to highlight field
      highlightField(field);
      
      // Call optional callback if provided
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
        // Use context to highlight field
        highlightField(field);
        
        // Call optional callback if provided
        if (onClickBox) {
          onClickBox(field, boxIndex);
        }
      }
    }
  };

  if (normalizedBoxes.length === 0) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-auto z-10" 
      style={{ width, height }}
      aria-label={`Highlight overlay for ${overlayFields.length} fields`}
    >
      {normalizedBoxes.map((box, index) => {
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
        )
      })}
    </div>
  );
});

HighlightOverlay.displayName = 'HighlightOverlay';
