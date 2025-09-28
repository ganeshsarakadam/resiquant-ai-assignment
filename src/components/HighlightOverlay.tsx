'use client'

import { memo, useMemo } from 'react';

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
  fieldValue: string;
  onClickBox: (fieldValue: string) => void;
  documentType: 'pdf' | 'docx' | 'xlsx';
  // Excel-specific props
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
  fieldValue,
  onClickBox,
  documentType,
  cellWidth = 80,
  cellHeight = 20,
  columnCount = 10,
  rowCount = 100,
  isActive = false,
  showLabels = false
}: HighlightOverlayProps) => {
  
  // Convert and validate boxes based on document type
  const normalizedBoxes = useMemo(() => {
    if (documentType === 'xlsx') {
      // Convert Excel cell ranges to pixel coordinates
      return (boxes as ExcelCellRange[])
        .map(box => excelToPixel(box[0], box[1], box[2], box[3], cellWidth, cellHeight, width, height))
        .filter(validateBox);
    } else {
      // Use boxes directly for PDF/DOCX (already normalized)
      return (boxes as NormalizedBBox[]).filter(validateBox);
    }
  }, [boxes, documentType, cellWidth, cellHeight, width, height]);

  const handleBoxClick = () => {
    onClickBox(fieldValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClickBox(fieldValue);
    }
  };

  if (normalizedBoxes.length === 0) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-auto z-10" 
      style={{ width, height }}
      aria-label={`Highlight overlay for ${fieldValue}`}
    >
      {normalizedBoxes.map((box, index) => (
        <div 
          key={index}
          className={`
            absolute cursor-pointer transition-all duration-200 hover:opacity-80
            border border-white border-opacity-30 rounded-sm
            ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
            focus:outline-none focus:ring-2 focus:ring-blue-500
          `}
          style={{ 
            left: `${box[0] * 100}%`, 
            top: `${box[1] * 100}%`, 
            width: `${box[2] * 100}%`, 
            height: `${box[3] * 100}%`, 
            backgroundColor: color, 
            opacity: opacity,
            boxShadow: '0 0 4px rgba(0,0,0,0.1)'
          }}
          onClick={handleBoxClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`Highlight for ${fieldValue} (${documentType === 'xlsx' ? 'Excel Cell' : 'Document Region'})`}
          title={`${fieldValue}${showLabels ? ` - ${documentType.toUpperCase()}` : ''}`}
        />
      ))}
    </div>
  );
});

HighlightOverlay.displayName = 'HighlightOverlay';
