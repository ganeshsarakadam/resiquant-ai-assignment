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
  data: (string | number | boolean | null)[][]; // 2D cell array
  colWidths?: number[]; // width in characters (wch) from sheet metadata
  rowHeights?: number[]; // height in points from sheet metadata
  merges?: XLSX.Range[]; // merged cell ranges
}

export const yieldToBrowser = async () => {
  const w = window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void };
  if (typeof w.requestIdleCallback === 'function') {
    await new Promise<void>(resolve => w.requestIdleCallback!(() => resolve(), { timeout: 60 }));
    return;
  }
  await new Promise(res => setTimeout(res, 0));
};
