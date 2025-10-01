import { useCallback, useEffect, useRef, useState } from 'react';
import type * as XLSX from 'xlsx-js-style';
import { SheetData, yieldToBrowser } from './types';
import { Document as DocType } from '@/types';

interface UseWorkbookLoaderParams {
  document: DocType;
  onReady?: (info: { pageCount: number }) => void;
  onError?: (error: Error) => void;
}

export function useWorkbookLoader({ document, onReady, onError }: UseWorkbookLoaderParams) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const xlsxRef = useRef<typeof import('xlsx-js-style') | null>(null);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadVersion(v => v + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        if (!xlsxRef.current) {
          xlsxRef.current = await import('xlsx-js-style');
        }
        const XLSXMod: typeof XLSX = xlsxRef.current;
        let buffer: ArrayBuffer;
        if (typeof document.url === 'string') {
          const response = await fetch(document.url, { signal: controller.signal });
          if (!response.ok) throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
          buffer = await response.arrayBuffer();
        } else {
          buffer = await (document.url as File).arrayBuffer();
        }
        await yieldToBrowser();
        const workbook = XLSXMod.read(buffer, { type: 'array' });
        const sheetData: SheetData[] = [];
        for (let i = 0; i < workbook.SheetNames.length; i++) {
          const sheetName = workbook.SheetNames[i];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSXMod.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as (string | number | boolean | null)[][];
          const colWidths = worksheet['!cols']?.map(col => col.wch || 8);
          const rowHeights = worksheet['!rows']?.map(row => row.hpt || 20);
          const merges = worksheet['!merges'];
          sheetData.push({ name: sheetName, data, colWidths, rowHeights, merges });
          if (i < workbook.SheetNames.length - 1) await yieldToBrowser();
        }
        if (!isMounted) return;
        setSheets(sheetData);
        setIsLoading(false);
        try { onReady?.({ pageCount: sheetData.length }); } catch (cbErr) { console.warn('[useWorkbookLoader] onReady error', cbErr); }
      } catch (err) {
        const e = err as unknown;
        if ((e as { name?: string })?.name === 'AbortError') return;
        console.error('[useWorkbookLoader] load error', e);
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'Failed to load spreadsheet');
          setIsLoading(false);
        }
        try { onError?.(e instanceof Error ? e : new Error('Failed to load spreadsheet')); } catch (cbErr) { console.warn('[useWorkbookLoader] onError error', cbErr); }
      }
    }

    load();
    return () => { isMounted = false; controller.abort(); };
  }, [document.url, onReady, onError, reloadVersion]);

  return { sheets, isLoading, error, retry, xlsxRef };
}
