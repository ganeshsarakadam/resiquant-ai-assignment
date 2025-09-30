import type * as XLSX from 'xlsx-js-style';
import { Document as DocType, ExtractedField } from '@/types';

export interface SheetViewerProps {
  document: DocType;
  extractedFields?: ExtractedField[];
  onReady?: (info: { pageCount: number }) => void;
  onError?: (error: Error) => void;
  onHighlightClick?: (field: ExtractedField) => void;
}

export interface SheetData {
  name: string;
  data: any[][];
  colWidths?: number[];
  rowHeights?: number[];
  merges?: XLSX.Range[];
}

export const yieldToBrowser = async () => {
  if (typeof (window as any).requestIdleCallback === 'function') {
    await new Promise(res => (window as any).requestIdleCallback(res, { timeout: 60 }));
  } else {
    await new Promise(res => setTimeout(res, 0));
  }
};
